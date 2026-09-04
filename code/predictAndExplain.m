%% predictAndExplain
% Predict diabetic retinopathy severity and generate Grad-CAM.
%
% Project: SIH26038_DR
%
% Input:
%   One retinal fundus image selected by the user.
%
% Output:
%   - Predicted DR severity
%   - Prediction confidence
%   - Grad-CAM heatmap
%   - Original image with Grad-CAM overlay

clear;
clc;
close all;

%% ============================================================
% 1. Find project root
% =============================================================

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

fprintf("============================================\n");
fprintf("SIH26038_DR - Prediction + Grad-CAM\n");
fprintf("============================================\n\n");

%% ============================================================
% 2. Define trained model path
% =============================================================

modelPath = fullfile( ...
    projectRoot, ...
    "models", ...
    "efficientnetb0_DR_trained.mat");

if ~isfile(modelPath)
    error( ...
        "Trained model not found:\n%s", ...
        modelPath);
end

%% ============================================================
% 3. Load trained model
% =============================================================

fprintf("Loading trained model...\n");

load( ...
    modelPath, ...
    "net", ...
    "classNames");

fprintf("Model loaded successfully.\n\n");

%% ============================================================
% 4. Select retinal image
% =============================================================

fprintf("Select a retinal fundus image.\n");

[fileName, filePath] = uigetfile( ...
    { ...
    "*.png;*.jpg;*.jpeg;*.tif;*.tiff", ...
    "Fundus Images"; ...
    "*.*", ...
    "All Files" ...
    }, ...
    "Select Fundus Image");

if isequal(fileName,0)

    fprintf("No image selected.\n");
    return;

end

imagePath = fullfile(filePath,fileName);

fprintf("Selected image:\n%s\n\n",imagePath);

%% ============================================================
% 5. Read image
% =============================================================

originalImage = imread(imagePath);

%% ============================================================
% 6. Ensure RGB
% =============================================================

if ndims(originalImage) == 2

    originalImage = cat( ...
        3, ...
        originalImage, ...
        originalImage, ...
        originalImage);

end

if size(originalImage,3) ~= 3

    error("Input image must be grayscale or RGB.");

end

%% ============================================================
% 7. Resize image for EfficientNet-B0
% =============================================================

inputSize = net.Layers(1).InputSize;

networkImage = imresize( ...
    originalImage, ...
    inputSize(1:2));

%% ============================================================
% 8. Generate prediction
% =============================================================

fprintf("Running model prediction...\n");

scores = predict( ...
    net, ...
    single(networkImage));

%% ============================================================
% 9. Find predicted class
% =============================================================

[confidence, predictedIndex] = ...
    max(scores,[],2);

predictedClass = classNames(predictedIndex);

confidencePercent = ...
    double(confidence) * 100;

fprintf("\n============================================\n");
fprintf("PREDICTION RESULT\n");
fprintf("============================================\n\n");

fprintf("Predicted class: %s\n", ...
    string(predictedClass));

fprintf("Confidence: %.2f%%\n\n", ...
    confidencePercent);

%% ============================================================
% 10. Display all class probabilities
% =============================================================

fprintf("Class probabilities:\n\n");

for i = 1:numel(classNames)

    fprintf( ...
        "  %-7s : %.2f%%\n", ...
        string(classNames(i)), ...
        double(scores(i))*100);

end

fprintf("\n");

%% ============================================================
% 11. Generate Grad-CAM
% =============================================================

fprintf("Generating Grad-CAM...\n");

scoreMap = gradCAM( ...
    net, ...
    networkImage, ...
    predictedIndex, ...
    ReductionLayer="Softmax");

fprintf("Grad-CAM generated successfully.\n\n");

%% ============================================================
% 12. Normalize Grad-CAM map
% =============================================================

scoreMap = rescale(scoreMap);

%% ============================================================
% 13. Display original image
% =============================================================

figure( ...
    "Name", ...
    "Original Fundus Image");

imshow(originalImage);

title( ...
    "Original Fundus Image");

%% ============================================================
% 14. Display resized input
% =============================================================

figure( ...
    "Name", ...
    "Model Input");

imshow(networkImage);

title( ...
    "EfficientNet-B0 Input - 224 x 224");

%% ============================================================
% 15. Display Grad-CAM heatmap
% =============================================================

figure( ...
    "Name", ...
    "Grad-CAM Heatmap");

imagesc(scoreMap);

axis image off;

colorbar;

title( ...
    "Grad-CAM - " + string(predictedClass));

%% ============================================================
% 16. Display Grad-CAM overlay
% =============================================================

figure( ...
    "Name", ...
    "Grad-CAM Overlay");

imshow(networkImage);

hold on;

imagesc( ...
    scoreMap, ...
    AlphaData=0.45);

axis image off;

colorbar;

title( ...
    "Grad-CAM Overlay - " + ...
    string(predictedClass) + ...
    " (" + ...
    sprintf("%.2f%%",confidencePercent) + ...
    ")");

hold off;

%% ============================================================
% 17. Screening interpretation
% =============================================================

if ismember( ...
        string(predictedClass), ...
        ["Level0","Level1"])

    screeningResult = ...
        "Non-referable DR";

else

    screeningResult = ...
        "Referable DR";

end

fprintf("============================================\n");
fprintf("SCREENING RESULT\n");
fprintf("============================================\n\n");

fprintf("Severity:   %s\n", ...
    string(predictedClass));

fprintf("Confidence: %.2f%%\n", ...
    confidencePercent);

fprintf("Screening:  %s\n\n", ...
    screeningResult);

fprintf("============================================\n");
fprintf("Prediction + Grad-CAM completed.\n");
fprintf("============================================\n");