%% createDatastores
% Create training, validation, and test datastores
% for diabetic retinopathy classification.
%
% Project: SIH26038_DR
%
% Dataset:
%   APTOS 2019
%
% Classes:
%   Level0 = No DR
%   Level1 = Mild NPDR
%   Level2 = Moderate NPDR
%   Level3 = Severe NPDR
%   Level4 = Proliferative DR
%
% Split:
%   70% Training
%   15% Validation
%   15% Test
%
% Training augmentation is applied only to the training set.

clear;
clc;

%% ============================================================
% 1. Find project root
% =============================================================

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

fprintf("============================================\n");
fprintf("SIH26038_DR - Creating Datastores\n");
fprintf("============================================\n\n");

fprintf("Project root:\n%s\n\n", projectRoot);

%% ============================================================
% 2. Locate dataset
% =============================================================

datasetFolder = fullfile( ...
    projectRoot, ...
    "dataset", ...
    "DR_5Class");

if ~isfolder(datasetFolder)
    error( ...
        "Dataset folder not found:\n%s", ...
        datasetFolder);
end

fprintf("Dataset folder found:\n%s\n\n", datasetFolder);

%% ============================================================
% 3. Create image datastore
% =============================================================

fprintf("Creating image datastore...\n");

imds = imageDatastore( ...
    datasetFolder, ...
    IncludeSubfolders=true, ...
    LabelSource="foldernames");

fprintf("Image datastore created.\n\n");

%% ============================================================
% 4. Display complete dataset information
% =============================================================

fprintf("Total number of images: %d\n\n", ...
    numel(imds.Files));

fprintf("Complete dataset class distribution:\n");

classTable = countEachLabel(imds);

disp(classTable);

%% ============================================================
% 5. Reproducible train/validation/test split
% =============================================================

fprintf("Creating train/validation/test split...\n");

% Fixed random seed makes the split reproducible.
rng(42);

[imdsTrain, imdsValidation, imdsTest] = ...
    splitEachLabel( ...
        imds, ...
        0.70, ...
        0.15, ...
        "randomized");

fprintf("Split completed.\n\n");

%% ============================================================
% 6. Display split sizes
% =============================================================

fprintf("Dataset split:\n");

fprintf("Training images:   %d\n", ...
    numel(imdsTrain.Files));

fprintf("Validation images: %d\n", ...
    numel(imdsValidation.Files));

fprintf("Test images:       %d\n\n", ...
    numel(imdsTest.Files));

%% ============================================================
% 7. Display class distribution for each split
% =============================================================

fprintf("Training class distribution:\n");
trainTable = countEachLabel(imdsTrain);
disp(trainTable);

fprintf("Validation class distribution:\n");
validationTable = countEachLabel(imdsValidation);
disp(validationTable);

fprintf("Test class distribution:\n");
testTable = countEachLabel(imdsTest);
disp(testTable);

%% ============================================================
% 8. Define image augmentation
% ============================================================

fprintf("Creating training augmentation...\n");

augmenter = imageDataAugmenter( ...
    RandRotation=[-10 10], ...
    RandXTranslation=[-10 10], ...
    RandYTranslation=[-10 10], ...
    RandXScale=[0.9 1.1], ...
    RandYScale=[0.9 1.1], ...
    RandXReflection=true);

fprintf("Training augmentation created.\n\n");

%% ============================================================
% 9. Create augmented training datastore
% =============================================================

fprintf("Creating training datastore...\n");

augimdsTrain = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsTrain, ...
    DataAugmentation=augmenter);

fprintf("Training datastore ready.\n\n");

%% ============================================================
% 10. Create validation datastore
% =============================================================

fprintf("Creating validation datastore...\n");

augimdsValidation = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsValidation);

fprintf("Validation datastore ready.\n\n");

%% ============================================================
% 11. Create test datastore
% =============================================================

fprintf("Creating test datastore...\n");

augimdsTest = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsTest);

fprintf("Test datastore ready.\n\n");

%% ============================================================
% 12. Verify datastore sizes
% =============================================================

fprintf("Datastore verification:\n");

fprintf("Training observations:   %d\n", ...
    augimdsTrain.NumObservations);

fprintf("Validation observations: %d\n", ...
    augimdsValidation.NumObservations);

fprintf("Test observations:       %d\n\n", ...
    augimdsTest.NumObservations);

%% ============================================================
% 13. Verify one training image
% =============================================================

fprintf("Testing one training sample...\n");

trainingSample = read(augimdsTrain);

sampleImage = trainingSample{1,1}{1};
sampleLabel = trainingSample{1,2};

fprintf("Sample image size:\n");
disp(size(sampleImage));

fprintf("Sample label:\n");
disp(sampleLabel);

%% ============================================================
% 14. Display sample
% =============================================================

figure( ...
    "Name", ...
    "Training Datastore Sample");

imshow(sampleImage);

title( ...
    "Augmented Training Sample - " + string(sampleLabel));

%% ============================================================
% 15. Final verification
% =============================================================

if isequal(size(sampleImage), [224 224 3])

    fprintf("SUCCESS: Training image is 224 x 224 x 3.\n");

else

    fprintf("ERROR: Unexpected training image size.\n");

end

fprintf("\n============================================\n");
fprintf("Datastore creation completed successfully.\n");
fprintf("============================================\n");