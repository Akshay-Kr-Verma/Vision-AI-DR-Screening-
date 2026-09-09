function jsonResponse = api_screen_adapter(imagePath)
    % Persistent network caching
    persistent net;
    persistent classNames;

    codeFolder = fileparts(mfilename("fullpath"));
    projectRoot = fileparts(codeFolder);

    if isempty(net)
        modelPath = fullfile(projectRoot, "models", "efficientnetb0_DR_trained.mat");
        if ~isfile(modelPath)
            modelPath = fullfile(projectRoot, "models", "efficientnetb0_DR_5class.mat");
        end
        loaded = load(modelPath, "net", "classNames");
        net = loaded.net;
        classNames = loaded.classNames;
    end

    % 1. Read fundus image
    originalImage = imread(imagePath);

    % 2. Ensure RGB
    if ndims(originalImage) == 2
        originalImage = cat(3, originalImage, originalImage, originalImage);
    end
    if size(originalImage, 3) ~= 3
        error("Input image must be grayscale or RGB.");
    end

    % 3. Resize for network input
    inputSize = net.Layers(1).InputSize;
    networkImage = imresize(originalImage, inputSize(1:2));

    % 4. Model prediction
    scores = predict(net, single(networkImage));
    [confidence, predictedIndex] = max(scores, [], 2);
    predictedClass = classNames(predictedIndex);

    % 5. Grad-CAM computation
    scoreMap = gradCAM(net, networkImage, predictedIndex, ReductionLayer="Softmax");
    scoreMap = rescale(scoreMap);

    % 6. Generate color heatmap overlay
    cmap = jet(256);
    heatmapRGB = ind2rgb(round(scoreMap * 255) + 1, cmap);
    heatmapResized = imresize(heatmapRGB, [size(originalImage, 1), size(originalImage, 2)]);
    origDouble = im2double(originalImage);
    
    alpha = 0.5;
    blended = (1 - alpha) * origDouble + alpha * heatmapResized;

    % Save overlay image to temp directory
    tempOverlayPath = fullfile(tempdir, "api_dr_gradcam.png");
    imwrite(blended, tempOverlayPath);

    % 7. Format JSON output
    res = struct();
    res.predicted_grade = double(predictedIndex) - 1; % 0 to 4 scale
    res.predicted_label = string(predictedClass);
    res.confidence = double(confidence);
    res.probabilities = double(scores(:)');
    res.overlay_path = tempOverlayPath;

    jsonResponse = jsonencode(res);
end