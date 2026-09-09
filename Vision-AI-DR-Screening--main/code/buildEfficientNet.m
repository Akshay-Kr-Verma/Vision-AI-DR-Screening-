%% buildEfficientNet
% Build a pretrained EfficientNet-B0 for 5-class
% diabetic retinopathy severity classification.
%
% Project: SIH26038_DR

clear;
clc;

%% ------------------------------------------------------------
% 1. Find project root
% ------------------------------------------------------------

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

fprintf("Project root:\n%s\n\n", projectRoot);

%% ------------------------------------------------------------
% 2. Define model path
% ------------------------------------------------------------

modelFolder = fullfile(projectRoot,"models");

if ~isfolder(modelFolder)
    mkdir(modelFolder);
end

modelPath = fullfile( ...
    modelFolder, ...
    "efficientnetb0_DR_5class.mat");

%% ------------------------------------------------------------
% 3. Load pretrained EfficientNet-B0
%    and adapt it for 5 classes
% ------------------------------------------------------------

fprintf("Loading pretrained EfficientNet-B0...\n");

net = imagePretrainedNetwork( ...
    "efficientnetb0", ...
    NumClasses=5);

fprintf("EfficientNet-B0 loaded successfully.\n\n");

%% ------------------------------------------------------------
% 4. Display network information
% ------------------------------------------------------------

fprintf("Network type:\n");
disp(class(net));

fprintf("Input size:\n");
disp(net.Layers(1).InputSize);

fprintf("Final layers:\n");
disp(net.Layers(end-2:end));

%% ------------------------------------------------------------
% 5. Save model
% ------------------------------------------------------------

save( ...
    modelPath, ...
    "net", ...
    "-v7.3");

fprintf("\nModel saved successfully:\n%s\n",modelPath);

%% ------------------------------------------------------------
% 6. Final message
% ------------------------------------------------------------

fprintf("\n========================================\n");
fprintf("EfficientNet-B0 DR model ready.\n");
fprintf("Number of classes: 5\n");
fprintf("Input size: 224 x 224 x 3\n");
fprintf("========================================\n");