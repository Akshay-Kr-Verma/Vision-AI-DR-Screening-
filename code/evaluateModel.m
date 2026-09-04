%% evaluateModel
% Evaluate the trained EfficientNet-B0 diabetic retinopathy model.
%
% Project: SIH26038_DR
%
% Evaluation:
%   - Test accuracy
%   - Confusion matrix
%   - Per-class precision
%   - Per-class recall
%   - Per-class F1-score
%   - Macro F1-score
%   - Referable DR sensitivity
%   - Referable DR specificity

clear;
clc;
close all;

%% ============================================================
% 1. Find project root
% =============================================================

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

fprintf("============================================\n");
fprintf("SIH26038_DR - Model Evaluation\n");
fprintf("============================================\n\n");

fprintf("Project root:\n%s\n\n", projectRoot);

%% ============================================================
% 2. Define paths
% =============================================================

modelPath = fullfile( ...
    projectRoot, ...
    "models", ...
    "efficientnetb0_DR_trained.mat");

datasetFolder = fullfile( ...
    projectRoot, ...
    "dataset", ...
    "DR_5Class");

if ~isfile(modelPath)
    error( ...
        "Trained model not found:\n%s", ...
        modelPath);
end

if ~isfolder(datasetFolder)
    error( ...
        "Dataset folder not found:\n%s", ...
        datasetFolder);
end

%% ============================================================
% 3. Load trained model
% =============================================================

fprintf("Loading trained model...\n");

load( ...
    modelPath, ...
    "net", ...
    "classNames");

fprintf("Trained model loaded successfully.\n\n");

%% ============================================================
% 4. Create complete datastore
% =============================================================

fprintf("Creating test dataset...\n");

imds = imageDatastore( ...
    datasetFolder, ...
    IncludeSubfolders=true, ...
    LabelSource="foldernames");

%% ============================================================
% 5. Recreate EXACT same train/validation/test split
% =============================================================

% IMPORTANT:
% The same random seed and split parameters used during
% training must be used here.

rng(42);

[~, ~, imdsTest] = ...
    splitEachLabel( ...
        imds, ...
        0.70, ...
        0.15, ...
        "randomized");

fprintf("Test images: %d\n\n", ...
    numel(imdsTest.Files));

%% ============================================================
% 6. Create test datastore
% =============================================================

augimdsTest = augmentedImageDatastore( ...
    [224 224 3], ...
    imdsTest);

fprintf("Test datastore ready.\n\n");

%% ============================================================
% 7. Get true labels
% =============================================================

trueLabels = imdsTest.Labels;

%% ============================================================
% 8. Generate predictions
% =============================================================

fprintf("Generating predictions...\n");
fprintf("This may take some time.\n\n");

reset(augimdsTest);

scores = minibatchpredict( ...
    net, ...
    augimdsTest);

fprintf("Predictions generated successfully.\n\n");

%% ============================================================
% 9. Convert scores to predicted classes
% =============================================================

[~, predictedIndex] = max(scores, [], 2);

predictedLabels = categorical( ...
    classNames(predictedIndex), ...
    categories(trueLabels));

%% ============================================================
% 10. Calculate overall accuracy
% =============================================================

correctPredictions = ...
    predictedLabels == trueLabels;

accuracy = mean(correctPredictions) * 100;

fprintf("============================================\n");
fprintf("OVERALL TEST PERFORMANCE\n");
fprintf("============================================\n\n");

fprintf("Test accuracy: %.2f%%\n\n", accuracy);

%% ============================================================
% 11. Confusion matrix
% =============================================================

fprintf("Creating confusion matrix...\n");

figure( ...
    "Name", ...
    "Confusion Matrix");

confusionchart( ...
    trueLabels, ...
    predictedLabels);

title("EfficientNet-B0 - Test Set Confusion Matrix");

%% ============================================================
% 12. Calculate confusion matrix numerically
% =============================================================

confusionMatrix = confusionmat( ...
    trueLabels, ...
    predictedLabels);

disp("Confusion matrix:");
disp(confusionMatrix);

%% ============================================================
% 13. Calculate per-class metrics
% =============================================================

numClasses = numel(categories(trueLabels));

precision = zeros(numClasses,1);
recall = zeros(numClasses,1);
f1Score = zeros(numClasses,1);

for i = 1:numClasses

    TP = confusionMatrix(i,i);

    FP = sum(confusionMatrix(:,i)) - TP;

    FN = sum(confusionMatrix(i,:)) - TP;

    %% Precision

    if (TP + FP) > 0
        precision(i) = TP / (TP + FP);
    else
        precision(i) = 0;
    end

    %% Recall

    if (TP + FN) > 0
        recall(i) = TP / (TP + FN);
    else
        recall(i) = 0;
    end

    %% F1

    if (precision(i) + recall(i)) > 0

        f1Score(i) = ...
            2 * ...
            precision(i) * recall(i) / ...
            (precision(i) + recall(i));

    else

        f1Score(i) = 0;

    end

end

%% ============================================================
% 14. Macro F1
% =============================================================

macroF1 = mean(f1Score);

%% ============================================================
% 15. Display per-class metrics
% =============================================================

fprintf("\n============================================\n");
fprintf("PER-CLASS PERFORMANCE\n");
fprintf("============================================\n\n");

fprintf( ...
    "%-10s %-12s %-12s %-12s\n", ...
    "Class", ...
    "Precision", ...
    "Recall", ...
    "F1-score");

fprintf( ...
    "------------------------------------------------\n");

classCategoryNames = categories(trueLabels);

for i = 1:numClasses

    fprintf( ...
        "%-10s %-12.4f %-12.4f %-12.4f\n", ...
        classCategoryNames{i}, ...
        precision(i), ...
        recall(i), ...
        f1Score(i));

end

fprintf("\nMacro F1-score: %.4f\n", macroF1);

%% ============================================================
% 16. Referable DR evaluation
% ============================================================

% Clinical screening grouping used for this prototype:
%
% Level0 + Level1 = Non-referable DR
% Level2 + Level3 + Level4 = Referable DR

trueReferable = ismember( ...
    string(trueLabels), ...
    ["Level2","Level3","Level4"]);

predictedReferable = ismember( ...
    string(predictedLabels), ...
    ["Level2","Level3","Level4"]);

%% Binary confusion matrix

referableCM = confusionmat( ...
    trueReferable, ...
    predictedReferable, ...
    Order=[false true]);

TN = referableCM(1,1);
FP = referableCM(1,2);
FN = referableCM(2,1);
TP = referableCM(2,2);

%% Sensitivity

if (TP + FN) > 0
    sensitivity = TP / (TP + FN);
else
    sensitivity = 0;
end

%% Specificity

if (TN + FP) > 0
    specificity = TN / (TN + FP);
else
    specificity = 0;
end

%% Precision / PPV

if (TP + FP) > 0
    referablePrecision = TP / (TP + FP);
else
    referablePrecision = 0;
end

%% ============================================================
% 17. Display referable DR results
% =============================================================

fprintf("\n============================================\n");
fprintf("REFERABLE DR SCREENING PERFORMANCE\n");
fprintf("============================================\n\n");

fprintf("Non-referable: Level0 + Level1\n");
fprintf("Referable:     Level2 + Level3 + Level4\n\n");

fprintf("True Negatives:  %d\n", TN);
fprintf("False Positives: %d\n", FP);
fprintf("False Negatives: %d\n", FN);
fprintf("True Positives:  %d\n\n", TP);

fprintf( ...
    "Sensitivity: %.2f%%\n", ...
    sensitivity * 100);

fprintf( ...
    "Specificity: %.2f%%\n", ...
    specificity * 100);

fprintf( ...
    "Precision:   %.2f%%\n\n", ...
    referablePrecision * 100);

%% ============================================================
% 18. Create referable DR confusion matrix
% =============================================================

figure( ...
    "Name", ...
    "Referable DR Confusion Matrix");

confusionchart( ...
    referableCM, ...
    ["Non-referable","Referable"]);

title( ...
    "Referable DR Screening");

%% ============================================================
% 19. Save evaluation results
% =============================================================

resultsFolder = fullfile( ...
    projectRoot, ...
    "results");

if ~isfolder(resultsFolder)
    mkdir(resultsFolder);
end

resultsPath = fullfile( ...
    resultsFolder, ...
    "evaluationResults.mat");

save( ...
    resultsPath, ...
    "accuracy", ...
    "confusionMatrix", ...
    "precision", ...
    "recall", ...
    "f1Score", ...
    "macroF1", ...
    "sensitivity", ...
    "specificity", ...
    "referablePrecision", ...
    "referableCM", ...
    "classCategoryNames");

fprintf("============================================\n");
fprintf("EVALUATION COMPLETED SUCCESSFULLY\n");
fprintf("============================================\n\n");

fprintf("Results saved to:\n%s\n\n", resultsPath);

fprintf("Test accuracy: %.2f%%\n", accuracy);
fprintf("Macro F1:      %.4f\n", macroF1);
fprintf("Sensitivity:   %.2f%%\n", sensitivity * 100);
fprintf("Specificity:   %.2f%%\n", specificity * 100);

fprintf("\n============================================\n");