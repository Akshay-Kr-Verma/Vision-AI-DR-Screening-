function outputImage = preprocessFundus(inputImage)
% preprocessFundus
% Preprocess an RGB fundus image for EfficientNet-B0.
%
% Input:
%   inputImage - original fundus image
%
% Output:
%   outputImage - 224x224x3 RGB image
%
% Processing:
%   1. Ensure RGB format
%   2. Detect retinal field
%   3. Remove surrounding black background
%   4. Preserve aspect ratio
%   5. Resize to 224x224
%
% No aggressive retinal cropping is performed.

    %% Target size

    targetHeight = 224;
    targetWidth  = 224;

    %% 1. Ensure RGB format

    if ndims(inputImage) == 2
        inputImage = cat(3, ...
            inputImage, ...
            inputImage, ...
            inputImage);
    end

    if size(inputImage,3) ~= 3
        error("Input image must be grayscale or RGB.");
    end

    %% 2. Convert to grayscale

    grayImage = rgb2gray(inputImage);

    %% 3. Detect non-black retinal region

    threshold = 10;

    retinalMask = grayImage > threshold;

    %% 4. Remove small isolated regions

    retinalMask = bwareaopen(retinalMask,1000);

    %% 5. Find largest connected component

    connectedComponents = bwconncomp(retinalMask);

    if connectedComponents.NumObjects == 0
        error("Unable to detect retinal field.");
    end

    componentSizes = cellfun( ...
        @numel, ...
        connectedComponents.PixelIdxList);

    [~,largestIndex] = max(componentSizes);

    largestRegion = false(size(retinalMask));

    largestRegion( ...
        connectedComponents.PixelIdxList{largestIndex}) = true;

    %% 6. Find bounding box

    regionProperties = regionprops( ...
        largestRegion, ...
        "BoundingBox");

    boundingBox = regionProperties.BoundingBox;

    x = max(1,floor(boundingBox(1)));
    y = max(1,floor(boundingBox(2)));

    width = min( ...
        size(inputImage,2)-x+1, ...
        ceil(boundingBox(3)));

    height = min( ...
        size(inputImage,1)-y+1, ...
        ceil(boundingBox(4)));

    %% 7. Remove surrounding black background

    croppedImage = inputImage( ...
        y:y+height-1, ...
        x:x+width-1, :);

    %% 8. Preserve aspect ratio

    scale = min( ...
        targetHeight / size(croppedImage,1), ...
        targetWidth / size(croppedImage,2));

    newHeight = round(size(croppedImage,1) * scale);
    newWidth  = round(size(croppedImage,2) * scale);

    resizedImage = imresize( ...
        croppedImage, ...
        [newHeight newWidth], ...
        "bicubic");

    %% 9. Create 224x224 output

    outputImage = zeros( ...
        targetHeight, ...
        targetWidth, ...
        3, ...
        "uint8");

    %% 10. Center image

    startRow = floor((targetHeight-newHeight)/2) + 1;
    startCol = floor((targetWidth-newWidth)/2) + 1;

    outputImage( ...
        startRow:startRow+newHeight-1, ...
        startCol:startCol+newWidth-1, :) = resizedImage;

end