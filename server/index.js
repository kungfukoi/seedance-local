import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { File } from "node:buffer";
import { randomUUID } from "node:crypto";
import { fal } from "@fal-ai/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const uploadsDir = path.join(rootDir, "uploads");
const outputsDir = path.join(rootDir, "outputs");
const dataDir = path.join(__dirname, "data");
const historyPath = path.join(dataDir, "history.json");
const nodeProjectsPath = path.join(dataDir, "node-projects.json");
const port = Number(process.env.PORT || 3333);
const seedanceStandardCostPerSecond = Number(process.env.SEEDANCE_STANDARD_COST_PER_SECOND || 0.3034);
const seedanceFastCostPerSecond = Number(process.env.SEEDANCE_FAST_COST_PER_SECOND || 0.2419);
const nanoBananaCost1K2K = Number(process.env.NANO_BANANA_IMAGE_COST_1K_2K || 0.134);
const nanoBananaCost4K = Number(process.env.NANO_BANANA_IMAGE_COST_4K || 0.24);
const openAiImage2MediumCost = Number(process.env.OPENAI_IMAGE_2_MEDIUM_COST || 0.053);

const app = express();

await Promise.all([mkdir(uploadsDir, { recursive: true }), mkdir(outputsDir, { recursive: true }), mkdir(dataDir, { recursive: true })]);

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "upload";
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${basename}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 11
  }
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use("/outputs", express.static(outputsDir));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    falKeyConfigured: Boolean(process.env.FAL_KEY),
    openAiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    outputDirectory: outputsDir
  });
});

app.get("/api/history", async (_req, res) => {
  res.json(await readHistory());
});

app.get("/api/stats", async (_req, res) => {
  res.json({
    history: await readHistory(),
    projects: await readNodeProjects(),
    pricing: {
      seedance: {
        standardCostPerSecond: seedanceStandardCostPerSecond,
        fastCostPerSecond: seedanceFastCostPerSecond,
        currency: "USD"
      },
      nanoBananaPro: {
        cost1K2K: nanoBananaCost1K2K,
        cost4K: nanoBananaCost4K,
        currency: "USD"
      },
      openAiImage2: {
        mediumCost: openAiImage2MediumCost,
        currency: "USD"
      }
    }
  });
});

app.get("/api/node-projects", async (_req, res) => {
  const projects = await readNodeProjects();
  res.json(projects.map(({ graph, ...project }) => project));
});

app.get("/api/node-projects/:id", async (req, res) => {
  const project = (await readNodeProjects()).find((item) => item.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: "Project not found." });
  }

  res.json(project);
});

app.post("/api/node-projects", async (req, res) => {
  const projects = await readNodeProjects();
  const now = new Date().toISOString();
  const id = req.body.id || randomUUID();
  const name = String(req.body.name || "Untitled project").trim() || "Untitled project";
  const project = {
    id,
    name,
    createdAt: projects.find((item) => item.id === id)?.createdAt || now,
    updatedAt: now,
    graph: {
      nodes: Array.isArray(req.body.nodes) ? req.body.nodes : [],
      edges: Array.isArray(req.body.edges) ? req.body.edges : [],
      viewport: req.body.viewport || { x: 0, y: 0, scale: 1 }
    }
  };

  const nextProjects = [project, ...projects.filter((item) => item.id !== id)];
  await writeNodeProjects(nextProjects);
  res.json(project);
});

app.delete("/api/node-projects/:id", async (req, res) => {
  const projects = await readNodeProjects();
  const nextProjects = projects.filter((item) => item.id !== req.params.id);

  if (nextProjects.length === projects.length) {
    return res.status(404).json({ error: "Project not found." });
  }

  await writeNodeProjects(nextProjects);
  res.json(nextProjects.map(({ graph, ...project }) => project));
});

app.delete("/api/history/:id", async (req, res) => {
  const history = await readHistory();
  const nextHistory = history.filter((item) => item.id !== req.params.id);

  if (nextHistory.length === history.length) {
    return res.status(404).json({ error: "History item not found." });
  }

  await writeHistory(nextHistory);
  res.json(nextHistory);
});

app.post("/api/node/upload-asset", upload.single("asset"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No asset uploaded." });
  }

  res.json({
    asset: {
      localUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      mediaType: mediaTypeForMime(req.file.mimetype)
    }
  });
});

app.post("/api/node/upload-style-collage", upload.single("asset"), async (req, res) => {
  return handleTransferCollageUpload(req, res);
});

app.post("/api/node/upload-transfer-collage", upload.single("asset"), async (req, res) => {
  return handleTransferCollageUpload(req, res);
});

async function handleTransferCollageUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No transfer collage uploaded." });
  }

  const nodeId = safePathSegment(req.body.nodeId || "transfer");
  const transferDir = path.join(uploadsDir, "transfers", nodeId);
  const storedFileName = path.join("transfers", nodeId, "TRANSFER.png");
  const targetPath = path.join(transferDir, "TRANSFER.png");

  await mkdir(transferDir, { recursive: true });
  await rm(targetPath, { force: true });
  await rename(req.file.path, targetPath);

  res.json({
    asset: {
      localUrl: `/uploads/${storedFileName.split(path.sep).join("/")}`,
      fileName: "TRANSFER.png",
      storedFileName: storedFileName.split(path.sep).join("/"),
      mimeType: "image/png",
      size: req.file.size,
      mediaType: "image"
    }
  });
}

app.post("/api/node/generate-image", async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const selectedModel = resolveImageModel(req.body.model);
    const imagePromptUrls = Array.isArray(req.body.imagePromptUrls) ? req.body.imagePromptUrls.filter(isLocalAssetUrl) : [];
    const imagePromptLabels = Array.isArray(req.body.imagePromptLabels) ? req.body.imagePromptLabels : [];

    if (selectedModel.provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ error: "Missing OPENAI_API_KEY in .env." });
      }

      const openAiImage = await generateOpenAiImage({
        prompt,
        imagePromptUrls,
        imagePromptLabels,
        aspectRatio: req.body.aspectRatio,
        resolution: req.body.resolution
      });
      const extension = extensionForMime(openAiImage.mimeType);
      const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-openai-image-2${extension}`;
      await writeFile(path.join(outputsDir, fileName), openAiImage.bytes);

      const cost = estimateOpenAiImage2Cost({
        resolution: req.body.resolution,
        size: openAiImage.size,
        quality: openAiImage.quality
      });
      await appendHistory({
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        mediaType: "image",
        provider: "OpenAI",
        modelName: selectedModel.displayName,
        endpoint: selectedModel.id,
        mode: imagePromptUrls.length ? "Image edit with references" : "Image generation",
        prompt,
        submittedPrompt: openAiImage.submittedPrompt,
        project: projectFromBody(req.body),
        node: nodeFromBody(req.body),
        settings: {
          model: req.body.model || selectedModel.displayName,
          aspectRatio: req.body.aspectRatio || "21:9",
          resolution: req.body.resolution || "2K",
          imageSize: openAiImage.size,
          quality: openAiImage.quality,
          imagePromptCount: imagePromptUrls.length
        },
        cost,
        localImage: `/outputs/${fileName}`,
        outputFileName: fileName,
        outputBytes: openAiImage.bytes.length,
        text: openAiImage.revisedPrompt || ""
      });

      return res.json({
        text: openAiImage.revisedPrompt || "",
        cost,
        image: {
          localUrl: `/outputs/${fileName}`,
          fileName,
          mimeType: openAiImage.mimeType
        }
      });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(400).json({ error: "Missing GOOGLE_API_KEY in .env." });
    }

    const model = selectedModel.id;
    const imageConfig = {
      aspectRatio: normalizeGeminiImageAspectRatio(req.body.aspectRatio),
      imageSize: normalizeGeminiImageSize(req.body.resolution)
    };
    const parts = [{ text: prompt }];

    for (const [index, imagePromptUrl] of imagePromptUrls.entries()) {
      const asset = await readLocalAsset(imagePromptUrl);
      if (!asset.mimeType.startsWith("image/")) continue;
      const label = cleanImagePromptLabel(imagePromptLabels[index]);
      if (label) {
        parts.push({ text: `Reference image label: ${label}` });
      }
      parts.push({
        inlineData: {
          mimeType: asset.mimeType,
          data: asset.buffer.toString("base64")
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GOOGLE_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Image generation failed.", raw: data });
    }

    const responseParts = data?.candidates?.[0]?.content?.parts || [];
    const text = responseParts.find((part) => part.text)?.text || "";
    const imagePart = responseParts.find((part) => part.inlineData?.data || part.inline_data?.data);
    const inlineData = imagePart?.inlineData || imagePart?.inline_data;

    if (!inlineData?.data) {
      return res.status(502).json({ error: "Gemini returned no image data.", text, raw: data });
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
    const extension = extensionForMime(mimeType);
    const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-nano-banana-pro${extension}`;
    const imageBytes = Buffer.from(inlineData.data, "base64");
    await writeFile(path.join(outputsDir, fileName), imageBytes);

    const cost = estimateImageCost({ resolution: req.body.resolution });
    await appendHistory({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      mediaType: "image",
      provider: "Google",
      modelName: selectedModel.displayName,
      endpoint: model,
      mode: "Image generation",
      prompt,
      submittedPrompt: prompt,
      project: projectFromBody(req.body),
      node: nodeFromBody(req.body),
      settings: {
        model: req.body.model || selectedModel.displayName,
        aspectRatio: req.body.aspectRatio || "21:9",
        resolution: req.body.resolution || "2K",
        imageConfig,
        imagePromptCount: imagePromptUrls.length
      },
      cost,
      localImage: `/outputs/${fileName}`,
      outputFileName: fileName,
      outputBytes: imageBytes.length,
      text
    });

    res.json({
      text,
      cost,
      image: {
        localUrl: `/outputs/${fileName}`,
        fileName,
        mimeType
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Image generation failed." });
  }
});

app.post("/api/node/generate-video", async (req, res) => {
  try {
    if (!process.env.FAL_KEY) {
      return res.status(400).json({ error: "Missing FAL_KEY in .env." });
    }

    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const speed = String(req.body.model || "").toLowerCase().includes("fast") ? "fast" : "standard";
    const speedPrefix = speed === "fast" ? "fast/" : "";
    const startFrameUrl = firstLocalOutput(req.body.startFrameUrls);
    const endFrameUrl = firstLocalOutput(req.body.endFrameUrls);
    const referenceImageUrls = Array.isArray(req.body.referenceImageUrls) ? req.body.referenceImageUrls.filter(isLocalAssetUrl) : [];
    const referenceVideoUrls = Array.isArray(req.body.referenceVideoUrls) ? req.body.referenceVideoUrls.filter(isLocalAssetUrl) : [];
    const referenceAudioUrls = Array.isArray(req.body.referenceAudioUrls) ? req.body.referenceAudioUrls.filter(isLocalAssetUrl) : [];
    const resolution = normalizeChoice(req.body.resolution, ["480p", "720p", "1080p"], "720p");
    const duration = normalizeDuration(req.body.duration);
    const aspectRatio = normalizeAspectRatio(req.body.aspectRatio);
    const generateAudio = Boolean(req.body.generateAudio);

    let routeKind = "text-to-video";
    if (startFrameUrl) {
      routeKind = "image-to-video";
    } else if (referenceImageUrls.length) {
      routeKind = "reference-to-video";
    }

    const input = {
      prompt,
      resolution,
      duration,
      aspect_ratio: aspectRatio,
      generate_audio: generateAudio
    };

    if (routeKind === "image-to-video") {
      input.image_url = await uploadLocalOutputToFal(startFrameUrl);
      if (endFrameUrl) {
        input.end_image_url = await uploadLocalOutputToFal(endFrameUrl);
      }
    }

    if (routeKind === "reference-to-video") {
      input.image_urls = await Promise.all(referenceImageUrls.map(uploadLocalOutputToFal));
    }

    const endpoint = `bytedance/seedance-2.0/${speedPrefix}${routeKind}`;
    const result = await fal.subscribe(endpoint, { input, logs: true });
    const remoteVideo = result?.data?.video;

    if (!remoteVideo?.url) {
      return res.status(502).json({ error: "Fal returned no video URL.", raw: result?.data });
    }

    const output = await downloadVideo(remoteVideo.url, routeKind);
    const cost = estimateSeedanceCost({
      speed,
      duration,
      resolution,
      endpoint,
      routeKind
    });
    await appendHistory({
      id: result.requestId || randomUUID(),
      createdAt: new Date().toISOString(),
      mediaType: "video",
      provider: "fal.ai",
      modelName: speed === "fast" ? "Seedance 2.0 Fast" : "Seedance 2.0",
      endpoint,
      mode: routeKindLabel(routeKind, speed),
      prompt,
      submittedPrompt: prompt,
      project: projectFromBody(req.body),
      node: nodeFromBody(req.body),
      settings: {
        speed,
        resolution,
        duration,
        aspectRatio,
        generateAudio,
        startFrameCount: startFrameUrl ? 1 : 0,
        endFrameCount: endFrameUrl ? 1 : 0,
        referenceImageCount: referenceImageUrls.length,
        referenceVideoCount: referenceVideoUrls.length,
        referenceAudioCount: referenceAudioUrls.length,
        seed: result?.data?.seed ?? null
      },
      cost,
      remoteVideo,
      localVideo: output.publicPath,
      outputFileName: output.fileName,
      outputBytes: output.bytes
    });

    res.json({
      requestId: result.requestId,
      seed: result?.data?.seed,
      endpoint,
      cost,
      video: {
        ...remoteVideo,
        localUrl: output.publicPath,
        fileName: output.fileName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Video generation failed." });
  }
});

app.post(
  "/api/generate",
  upload.fields([
    { name: "startFrame", maxCount: 1 },
    { name: "endFrame", maxCount: 1 },
    { name: "references", maxCount: 9 }
  ]),
  async (req, res) => {
    try {
      if (!process.env.FAL_KEY) {
        return res.status(400).json({ error: "Missing FAL_KEY in .env. Add your Fal API key, then restart the server." });
      }

      const prompt = String(req.body.prompt || "").trim();
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const startFrame = req.files?.startFrame?.[0];
      const endFrame = req.files?.endFrame?.[0];
      const references = req.files?.references || [];
      const referenceNames = parseReferenceNames(req.body.referenceNames, references.length);

      if (endFrame && !startFrame) {
        return res.status(400).json({ error: "End frame requires a start frame." });
      }

      const speed = normalizeChoice(req.body.speed, ["standard", "fast"], "standard");
      const resolution = normalizeChoice(req.body.resolution, ["480p", "720p", "1080p"], "720p");
      const duration = normalizeChoice(req.body.duration, ["auto", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], "15");
      const aspectRatio = normalizeChoice(req.body.aspectRatio, ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], "21:9");
      const generateAudio = String(req.body.generateAudio ?? "true") === "true";
      const seed = req.body.seed ? Number(req.body.seed) : undefined;

      const route = resolveRoute({ startFrame, references, speed });
      const promptForFal = route.kind === "reference-to-video" ? rewriteReferenceMentions(prompt, referenceNames) : prompt;
      const input = {
        prompt: promptForFal,
        resolution,
        duration,
        aspect_ratio: aspectRatio,
        generate_audio: generateAudio
      };

      if (Number.isInteger(seed)) {
        input.seed = seed;
      }

      const uploadedFiles = [];

      if (route.kind === "image-to-video") {
        const imageUrl = await uploadToFal(startFrame);
        uploadedFiles.push({ role: "startFrame", local: startFrame.filename, url: imageUrl });
        input.image_url = imageUrl;

        if (endFrame) {
          const endImageUrl = await uploadToFal(endFrame);
          uploadedFiles.push({ role: "endFrame", local: endFrame.filename, url: endImageUrl });
          input.end_image_url = endImageUrl;
        }
      }

      if (route.kind === "reference-to-video") {
        const imageUrls = [];
        for (const reference of references) {
          const referenceUrl = await uploadToFal(reference);
          imageUrls.push(referenceUrl);
          uploadedFiles.push({ role: "reference", name: referenceNames[imageUrls.length - 1], local: reference.filename, url: referenceUrl });
        }
        input.image_urls = imageUrls;
      }

      const result = await fal.subscribe(route.endpoint, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            for (const log of update.logs || []) {
              console.log(`[fal] ${log.message}`);
            }
          }
        }
      });

      const remoteVideo = result?.data?.video;
      if (!remoteVideo?.url) {
        return res.status(502).json({ error: "Fal returned no video URL.", raw: result?.data });
      }

      const output = await downloadVideo(remoteVideo.url, route.kind);
      const cost = estimateSeedanceCost({
        speed,
        duration,
        resolution,
        endpoint: route.endpoint,
        routeKind: route.kind
      });
      const historyItem = {
        id: result.requestId || randomUUID(),
        createdAt: new Date().toISOString(),
        mediaType: "video",
        provider: "fal.ai",
        modelName: speed === "fast" ? "Seedance 2.0 Fast" : "Seedance 2.0",
        prompt,
        submittedPrompt: promptForFal,
        endpoint: route.endpoint,
        mode: route.label,
        project: {
          id: "video",
          name: "Video"
        },
        referenceNames,
        settings: {
          speed,
          resolution,
          duration,
          aspectRatio,
          generateAudio,
          seed: result?.data?.seed ?? seed ?? null
        },
        cost,
        uploadedFiles,
        remoteVideo,
        localVideo: output.publicPath,
        outputFileName: output.fileName,
        outputBytes: output.bytes
      };

      await appendHistory(historyItem);

      res.json({
        requestId: result.requestId,
        seed: result?.data?.seed,
        endpoint: route.endpoint,
        mode: route.label,
        cost,
        video: {
          ...remoteVideo,
          localUrl: output.publicPath,
          fileName: output.fileName
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Generation failed." });
    }
  }
);

app.listen(port, "127.0.0.1", () => {
  console.log(`NewtNode server running on http://127.0.0.1:${port}`);
});

function resolveRoute({ startFrame, references, speed }) {
  const speedPrefix = speed === "fast" ? "fast/" : "";

  if (startFrame) {
    return {
      kind: "image-to-video",
      label: speed === "fast" ? "Fast image to video" : "Image to video",
      endpoint: `bytedance/seedance-2.0/${speedPrefix}image-to-video`
    };
  }

  if (references?.length) {
    return {
      kind: "reference-to-video",
      label: speed === "fast" ? "Fast reference to video" : "Reference to video",
      endpoint: `bytedance/seedance-2.0/${speedPrefix}reference-to-video`
    };
  }

  return {
    kind: "text-to-video",
    label: speed === "fast" ? "Fast text to video" : "Text to video",
    endpoint: `bytedance/seedance-2.0/${speedPrefix}text-to-video`
  };
}

function normalizeChoice(value, choices, fallback) {
  const normalized = String(value || fallback);
  return choices.includes(normalized) ? normalized : fallback;
}

function parseReferenceNames(rawValue, count) {
  let names = [];

  try {
    names = JSON.parse(rawValue || "[]");
  } catch {
    names = [];
  }

  const usedNames = new Set();
  return Array.from({ length: count }, (_value, index) => {
    const fallback = `Image${index + 1}`;
    const baseName = cleanReferenceName(names[index]) || fallback;
    return uniqueReferenceName(baseName, usedNames);
  });
}

function rewriteReferenceMentions(prompt, referenceNames) {
  const mentionMap = new Map();

  referenceNames.forEach((name, index) => {
    mentionMap.set(name.toLowerCase(), `@Image${index + 1}`);
  });

  return prompt.replace(/@([A-Za-z0-9_-]+)/g, (fullMatch, name) => mentionMap.get(name.toLowerCase()) || fullMatch);
}

function cleanReferenceName(value) {
  return String(value || "")
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 28);
}

function cleanImagePromptLabel(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9_. -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function safePathSegment(value) {
  return String(value || "transfer")
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 80) || "transfer";
}

function uniqueReferenceName(value, usedNames) {
  const fallback = cleanReferenceName(value) || "Image";
  let name = fallback;
  let suffix = 2;

  while (usedNames.has(name.toLowerCase())) {
    name = `${fallback}${suffix}`;
    suffix += 1;
  }

  usedNames.add(name.toLowerCase());
  return name;
}

async function uploadToFal(file) {
  const buffer = await readFile(file.path);
  const falFile = new File([buffer], file.originalname, {
    type: file.mimetype || "application/octet-stream"
  });

  return fal.storage.upload(falFile);
}

async function downloadVideo(url, kind) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download generated video: ${response.status} ${response.statusText}`);
  }

  const extension = path.extname(new URL(url).pathname) || ".mp4";
  const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${kind}${extension}`;
  const outputPath = path.join(outputsDir, fileName);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);

  return {
    fileName,
    publicPath: `/outputs/${fileName}`,
    bytes: bytes.length
  };
}

async function readHistory() {
  if (!existsSync(historyPath)) {
    return [];
  }

  try {
    return JSON.parse(await readFile(historyPath, "utf8"));
  } catch {
    await rm(historyPath, { force: true });
    return [];
  }
}

async function appendHistory(item) {
  const history = await readHistory();
  history.unshift(item);
  await writeHistory(history.slice(0, 500));
}

async function writeHistory(history) {
  await writeFile(historyPath, JSON.stringify(history, null, 2));
}

function estimateSeedanceCost({ speed, duration, resolution, endpoint, routeKind }) {
  const seconds = durationToSeconds(duration);
  const isFast = speed === "fast" || String(endpoint || "").includes("/fast/");
  const unitRateUsd = isFast ? seedanceFastCostPerSecond : seedanceStandardCostPerSecond;
  const amountUsd = roundCurrency(seconds * unitRateUsd);

  return {
    amountUsd,
    currency: "USD",
    unitRateUsd,
    units: seconds,
    unit: "second",
    mediaType: "video",
    resolution,
    pricingBasis: "Seedance 2.0 documented 720p per-second fal.ai estimate",
    routeKind
  };
}

function estimateImageCost({ resolution }) {
  const normalized = String(resolution || "2K").toUpperCase();
  const amountUsd = normalized.includes("4K") ? nanoBananaCost4K : nanoBananaCost1K2K;

  return {
    amountUsd: roundCurrency(amountUsd),
    currency: "USD",
    unitRateUsd: amountUsd,
    units: 1,
    unit: "image",
    mediaType: "image",
    resolution,
    pricingBasis: "Gemini 3 Pro Image Preview output image estimate"
  };
}

function estimateOpenAiImage2Cost({ resolution, size, quality }) {
  return {
    amountUsd: roundCurrency(openAiImage2MediumCost),
    currency: "USD",
    unitRateUsd: openAiImage2MediumCost,
    units: 1,
    unit: "image",
    mediaType: "image",
    resolution,
    size,
    quality,
    pricingBasis: "OpenAI GPT Image 2 medium image output estimate"
  };
}

function durationToSeconds(duration) {
  if (duration === "auto") return 15;
  const match = String(duration || "15").match(/\d+/);
  return Math.max(1, Number(match?.[0] || 15));
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}

function projectFromBody(body) {
  const id = String(body.projectId || "").trim();
  const name = String(body.projectName || "").trim();
  return {
    id: id || "node-workspace",
    name: name || "Node workspace"
  };
}

function nodeFromBody(body) {
  const id = String(body.nodeId || "").trim();
  const title = String(body.nodeTitle || "").trim();
  if (!id && !title) return undefined;
  return { id, title };
}

function routeKindLabel(routeKind, speed) {
  const prefix = speed === "fast" ? "Fast " : "";
  if (routeKind === "image-to-video") return `${prefix}image to video`;
  if (routeKind === "reference-to-video") return `${prefix}reference to video`;
  return `${prefix}text to video`;
}

async function readNodeProjects() {
  if (!existsSync(nodeProjectsPath)) {
    return [];
  }

  try {
    return JSON.parse(await readFile(nodeProjectsPath, "utf8"));
  } catch {
    await rm(nodeProjectsPath, { force: true });
    return [];
  }
}

async function writeNodeProjects(projects) {
  await writeFile(nodeProjectsPath, JSON.stringify(projects, null, 2));
}

function resolveImageModel(model) {
  const normalized = String(model || "").toLowerCase();
  if (normalized.includes("openai") || normalized.includes("gpt-image-2") || normalized.includes("image 2")) {
    return {
      provider: "openai",
      displayName: "OpenAI Image 2",
      id: "gpt-image-2"
    };
  }

  return {
    provider: "google",
    displayName: "Nano Banana Pro",
    id: "gemini-3-pro-image-preview"
  };
}

function normalizeGeminiImageAspectRatio(value) {
  const normalized = String(value || "21:9").match(/\d+:\d+/)?.[0] || "21:9";
  return normalizeChoice(normalized, ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"], "21:9");
}

function normalizeGeminiImageSize(value) {
  const normalized = String(value || "2K").toUpperCase();
  return normalizeChoice(normalized, ["1K", "2K", "4K"], "2K");
}

async function generateOpenAiImage({ prompt, imagePromptUrls, imagePromptLabels, aspectRatio, resolution }) {
  const imageInputs = [];

  for (const [index, imagePromptUrl] of imagePromptUrls.entries()) {
    const asset = await readLocalAsset(imagePromptUrl);
    if (!asset.mimeType.startsWith("image/")) continue;
    imageInputs.push({
      ...asset,
      label: cleanImagePromptLabel(imagePromptLabels[index])
    });
  }

  const size = normalizeOpenAiImageSize({ aspectRatio, resolution });
  const quality = normalizeOpenAiImageQuality(process.env.OPENAI_IMAGE_2_QUALITY || "medium");
  const submittedPrompt = promptWithReferenceLabels(prompt, imageInputs);
  const endpoint = imageInputs.length ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations";
  const requestOptions = imageInputs.length
    ? openAiImageEditRequest({ prompt: submittedPrompt, imageInputs, size, quality })
    : openAiImageGenerationRequest({ prompt: submittedPrompt, size, quality });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      ...requestOptions.headers
    },
    body: requestOptions.body
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI image generation failed.");
  }

  const image = data?.data?.[0];
  const base64Image = image?.b64_json || image?.b64;
  if (!base64Image) {
    throw new Error("OpenAI returned no image data.");
  }

  return {
    bytes: Buffer.from(base64Image, "base64"),
    mimeType: mimeForOpenAiOutputFormat("png"),
    size,
    quality,
    submittedPrompt,
    revisedPrompt: image?.revised_prompt || ""
  };
}

function openAiImageGenerationRequest({ prompt, size, quality }) {
  return {
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size,
      quality,
      output_format: "png"
    })
  };
}

function openAiImageEditRequest({ prompt, imageInputs, size, quality }) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", quality);
  form.append("output_format", "png");

  imageInputs.slice(0, 16).forEach((image, index) => {
    const extension = extensionForMime(image.mimeType);
    const fileName = `${image.label || `reference-${index + 1}`}${extension}`;
    form.append("image[]", new File([image.buffer], fileName, { type: image.mimeType }));
  });

  return {
    headers: {},
    body: form
  };
}

function promptWithReferenceLabels(prompt, imageInputs) {
  const labels = imageInputs.map((image, index) => image.label || `Reference ${index + 1}`).filter(Boolean);
  if (!labels.length) return prompt;
  return `${prompt}\n\nReference image labels: ${labels.join(", ")}`;
}

function normalizeOpenAiImageQuality(value) {
  return normalizeChoice(String(value || "medium").toLowerCase(), ["low", "medium", "high", "auto"], "medium");
}

function normalizeOpenAiImageSize({ aspectRatio, resolution }) {
  const ratio = String(aspectRatio || "21:9").match(/\d+:\d+/)?.[0] || "21:9";
  const normalizedResolution = String(resolution || "2K").toUpperCase();
  const sizeMap = {
    "1K": {
      "21:9": "1344x576",
      "16:9": "1280x720",
      "1:1": "1024x1024",
      "9:16": "720x1280"
    },
    "2K": {
      "21:9": "2048x880",
      "16:9": "2048x1152",
      "1:1": "2048x2048",
      "9:16": "1152x2048"
    },
    "4K": {
      "21:9": "3840x1648",
      "16:9": "3840x2160",
      "1:1": "2880x2880",
      "9:16": "2160x3840"
    }
  };

  return sizeMap[normalizedResolution]?.[ratio] || sizeMap["2K"]["21:9"];
}

function mimeForOpenAiOutputFormat(format) {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function extensionForMime(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

function normalizeDuration(value) {
  const match = String(value || "15").match(/\d+/);
  return normalizeChoice(match?.[0], ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], "15");
}

function normalizeAspectRatio(value) {
  const normalized = String(value || "16:9").match(/\d+:\d+/)?.[0] || "16:9";
  return normalizeChoice(normalized, ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], "16:9");
}

function firstLocalOutput(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.find(isLocalAssetUrl);
}

function isLocalOutputUrl(value) {
  return typeof value === "string" && value.startsWith("/outputs/");
}

function isLocalAssetUrl(value) {
  return typeof value === "string" && (value.startsWith("/outputs/") || value.startsWith("/uploads/"));
}

async function uploadLocalOutputToFal(publicPath) {
  const { fileName, buffer } = await readLocalAsset(publicPath);
  const falFile = new File([buffer], fileName, {
    type: mimeForExtension(path.extname(fileName))
  });

  return fal.storage.upload(falFile);
}

async function readLocalAsset(publicPath) {
  const { fileName, filePath } = resolveLocalAssetPath(publicPath);
  const buffer = await readFile(filePath);

  return {
    fileName,
    buffer,
    mimeType: mimeForExtension(path.extname(fileName).toLowerCase())
  };
}

function resolveLocalAssetPath(publicPath) {
  const isUpload = publicPath.startsWith("/uploads/");
  const prefix = isUpload ? "/uploads/" : "/outputs/";
  const root = isUpload ? uploadsDir : outputsDir;
  const relativePath = path.normalize(decodeURIComponent(publicPath.slice(prefix.length)));

  if (path.isAbsolute(relativePath) || relativePath.startsWith("..")) {
    throw new Error("Invalid local asset path.");
  }

  return {
    fileName: path.basename(relativePath),
    filePath: path.join(root, relativePath)
  };
}

function mimeForExtension(extension) {
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".mov" || extension === ".qt") return "video/quicktime";
  if (extension === ".webm") return "video/webm";
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".wav") return "audio/wav";
  if (extension === ".m4a") return "audio/mp4";
  return "image/png";
}

function mediaTypeForMime(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}
