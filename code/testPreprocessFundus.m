%% testPreprocessFundus
% Test preprocessFundus using one APTOS image.

clear;
clc;
close all;

%% Find project root

codeFolder = fileparts(mfilename("fullpath"));
projectRoot = fileparts(codeFolder);

%% Locate APTOS CSV

trainCSV = fullfile( ...
    projectRoot, ...
    "dataset", ...
    "APTOS", ...
    "train.csv");

if ~isfile(trainCSV)
    error("APTOS train.csv not found:\n%s",trainCSV);
end

%% Load labels

trainTable = readtable(trainCSV);

%% Select first image

imageID = string(trainTable.id_code(1));

imagePath = fullfile( ...
    projectRoot, ...
    "dataset", ...
    "APTOS", ...
    "train_images", ...
    imageID + ".png");

if ~isfile(imagePath)
    error("APTOS image not found:\n%s",imagePath);
end

fprintf("Testing image:\n%s\n\n",imagePath);

%% Read original image

originalImage = imread(imagePath);

fprintf("Original image size:\n");
disp(size(originalImage));

%% Apply preprocessing

processedImage = preprocessFundus(originalImage);

fprintf("Processed image size:\n");
disp(size(processedImage));

%% Display original

figure("Name","Original Fundus Image");

imshow(originalImage);

title("Original APTOS Image");

%% Display processed

figure("Name","Processed Fundus Image");

imshow(processedImage);

title("Processed APTOS Image");

%% Verify output

if isequal(size(processedImage),[224 224 3])

    fprintf("SUCCESS: Output is 224 x 224 x 3.\n");

else

    fprintf("ERROR: Unexpected output size.\n");

end