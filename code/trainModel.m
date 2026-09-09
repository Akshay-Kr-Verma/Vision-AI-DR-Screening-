%% trainModel
% Train EfficientNet-B0 for 5-class diabetic retinopathy classification.
%
% Project: SIH26038_DR
%
% Model:
%   EfficientNet-B0
%
% Classes:
%   Level0 = No DR
%   Level1 = Mild NPDR
%   Level2 = Moderate NPDR
%   Level3 = Severe NPDR
%   Level4 = Proliferative DR
%
% Training:
%   Adam optimizer
%   Class-weighted cross-entropy
%   GPU acceleration
%
% Data split:
%   70% Training
%   15% Validation
%   15% Test

clear;
clc;

%% ============================================================
% 1. Find project root
% =============================================================

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

fprintf("============================================\n");
fprintf("SIH26038_DR - Model Training\n");
fprintf("============================================\n\n");

fprintf("Project root:\n%s\n\n", projectRoot);

%% ============================================================
% 2. Define important paths
% =============================================================

modelFolder = fullfile( ...
    projectRoot, ...
    "models");

checkpointFolder = fullfile( ...
    projectRoot, ...
    "checkpoints");

trainedModelPath = fullfile( ...
    modelFolder, ...
    "efficientnetb0_DR_trained.mat");

%% Create folders if necessary

if ~isfolder(modelFolder)
    mkdir(modelFolder);
end

if ~isfolder(checkpointFolder)
    mkdir(checkpointFolder);
end

%% ============================================================
% 3. Recreate datastores
% =============================================================

fprintf("Creating datastores...\n\n");

datasetFolder = fullfile( ...
    projectRoot, ...
    "dataset", ...
    "DR_5Class");

if ~isfolder(datasetFolder)
    error( ...
        "Dataset folder not found:\n%s", ...
        datasetFolder);
end

%% Create image datastore

imds = imageDatastore( ...
    datasetFolder, ...
    IncludeSubfolders=true, ...
    LabelSource="foldernames");

%% Reproducible split

rng(42);

[imdsTrain, imdsValidation, imdsTest] = ...
    splitEachLabel( ...
        imds, ...
        0.70, ...
        0.15, ...
        "randomized");

%% ============================================================
% 4. Create training augmentation
% =============================================================

fprintf("Creating training augmentation...\n");

augmenter = imageDataAugmenter( ...
    RandRotation=[-10 10], ...
    RandXTranslation=[-10 10], ...
    RandYTranslation=[-10 10], ...
    RandXScale=[0.9 1.1], ...
    RandYScale=[0.9 1.1], ...
    RandXReflection=true);

%% ============================================================
% 5. Create training/validation/test datastores
% =============================================================

fprintf("Creating training datastore...\n");

augimdsTrain = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsTrain, ...
    DataAugmentation=augmenter);

fprintf("Creating validation datastore...\n");

augimdsValidation = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsValidation);

fprintf("Creating test datastore...\n");

augimdsTest = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsTest);

fprintf("Datastores ready.\n\n");

%% ============================================================
% 6. Display dataset sizes
% =============================================================

fprintf("Dataset sizes:\n");

fprintf("Training:   %d images\n", ...
    numel(imdsTrain.Files));

fprintf("Validation: %d images\n", ...
    numel(imdsValidation.Files));

fprintf("Test:       %d images\n\n", ...
    numel(imdsTest.Files));

%% ============================================================
% 7. Calculate class weights
% =============================================================

fprintf("Calculating class weights...\n\n");

classTable = countEachLabel(imdsTrain);

classNames = classTable.Label;
classCounts = classTable.Count;

numClasses = numel(classNames);
totalTrainingImages = sum(classCounts);

% Balanced class-weight formula:
%
% weight(class) =
%       total images
%       ---------------------------
%       number of classes * class count

classWeights = ...
    totalTrainingImages ./ ...
    (numClasses .* classCounts);

fprintf("Class weights:\n");

for i = 1:numClasses

    fprintf( ...
        "  %-7s : %.4f  (%d images)\n", ...
        string(classNames(i)), ...
        classWeights(i), ...
        classCounts(i));

end

fprintf("\n");

%% ============================================================
% 8. Load EfficientNet-B0 adapted for 5 classes
% =============================================================

fprintf("Loading EfficientNet-B0...\n");

net = imagePretrainedNetwork( ...
    "efficientnetb0", ...
    NumClasses=numClasses);

fprintf("EfficientNet-B0 loaded.\n\n");

%% ============================================================
% 9. Verify network input/output
% =============================================================

fprintf("Network verification:\n");

fprintf("Input size:\n");
disp(net.Layers(1).InputSize);

fprintf("Output layer:\n");
disp(net.Layers(end));

fprintf("\n");

%% ============================================================
% 10. Create weighted cross-entropy loss
% =============================================================

fprintf("Creating weighted cross-entropy loss...\n");

lossFcn = @(Y,T) crossentropy( ...
    Y, ...
    T, ...
    classWeights, ...
    WeightsFormat="C");

%% Accelerate the custom loss function.
%
% R2026a supports AcceleratedFunction objects for trainnet.

lossFcn = dlaccelerate(lossFcn);

fprintf("Weighted loss function ready.\n\n");

%% ============================================================
% 11. Calculate validation frequency
% =============================================================

miniBatchSize = 32;

iterationsPerEpoch = floor( ...
    augimdsTrain.NumObservations / miniBatchSize);

fprintf("Mini-batch size: %d\n", ...
    miniBatchSize);

fprintf("Iterations per epoch: %d\n\n", ...
    iterationsPerEpoch);

%% ============================================================
% 12. Define training options
% =============================================================

fprintf("Configuring training options...\n");

options = trainingOptions( ...
    "adam", ...
    MiniBatchSize=miniBatchSize, ...
    MaxEpochs=10, ...
    InitialLearnRate=1e-4, ...
    Shuffle="every-epoch", ...
    ValidationData=augimdsValidation, ...
    ValidationFrequency=iterationsPerEpoch, ...
    ValidationPatience=3, ...
    OutputNetwork="best-validation", ...
    ExecutionEnvironment="auto", ...
    CheckpointPath=checkpointFolder, ...
    Plots="training-progress", ...
    Metrics="accuracy", ...
    Verbose=true);

fprintf("Training options ready.\n\n");

%% ============================================================
% 13. Display training configuration
% =============================================================

fprintf("============================================\n");
fprintf("TRAINING CONFIGURATION\n");
fprintf("============================================\n");

fprintf("Model:              EfficientNet-B0\n");
fprintf("Number of classes:  %d\n", numClasses);
fprintf("Input size:         224 x 224 x 3\n");
fprintf("Optimizer:          Adam\n");
fprintf("Mini-batch size:    %d\n", miniBatchSize);
fprintf("Maximum epochs:     %d\n", options.MaxEpochs);
fprintf("Learning rate:      %.0e\n", options.InitialLearnRate);
fprintf("Validation patience:%d\n", options.ValidationPatience);
fprintf("Execution:          %s\n", options.ExecutionEnvironment);

fprintf("============================================\n\n");

%% ============================================================
% 14. Start training
% =============================================================

fprintf("Starting EfficientNet-B0 training...\n");
fprintf("This may take some time.\n\n");

[net,info] = trainnet( ...
    augimdsTrain, ...
    net, ...
    lossFcn, ...
    options);

fprintf("\nTraining completed.\n\n");

%% ============================================================
% 15. Save trained model
% =============================================================

fprintf("Saving trained model...\n");

save( ...
    trainedModelPath, ...
    "net", ...
    "info", ...
    "classNames", ...
    "classWeights", ...
    "-v7.3");

fprintf("\nTrained model saved successfully:\n");
fprintf("%s\n\n", trainedModelPath);

%% ============================================================
% 16. Final message
% =============================================================

fprintf("============================================\n");
fprintf("TRAINING COMPLETED SUCCESSFULLY\n");
fprintf("============================================\n");

fprintf("Model:\n%s\n\n", trainedModelPath);

fprintf("Classes:\n");

for i = 1:numClasses
    fprintf("  %d -> %s\n", ...
        i, ...
        string(classNames(i)));
end

fprintf("\nNext step: evaluate the model on the test set.\n");
fprintf("============================================\n");