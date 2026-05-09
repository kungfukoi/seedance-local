import React from "react";
import {
  Camera,
  ChevronDown,
  Compass,
  FileAudio,
  FileImage,
  Film,
  MonitorPlay,
  ImagePlus,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Plus,
  Save,
  Trash2,
  Type,
  Unlock,
  Video,
  X
} from "lucide-react";
import "./nodeEditor.css";

const nodeCatalog = [
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: FileImage },
  { type: "camera", label: "Camera", icon: Camera },
  { type: "style", label: "Style", icon: Palette },
  { type: "transfer", label: "Transfer", icon: Compass },
  { type: "video", label: "Video", icon: Video },
  { type: "audio", label: "Audio", icon: FileAudio },
  { type: "preview", label: "Preview", icon: MonitorPlay },
  { type: "imageModel", label: "Image Model", icon: ImagePlus },
  { type: "videoModel", label: "Video Model", icon: Film }
];

const portColors = {
  prompt: "#f0c83b",
  image: "#3d85ff",
  camera: "#ef4444",
  style: "#9b5cff",
  transfer: "#ff4fb3",
  video: "#58ce63",
  audio: "#ff8b35",
  preview: "#8d8d8d"
};

const maxTransferImages = 6;
const transferPromptSuffix =
  "Only use the uploaded collage reference image labeled TRANSFER.png as a transfer reference for color grading, grain style, texture, lighting, and camera qualities. The generated image should NOT take content, layout, subjects, or composition from TRANSFER.png directly; only use it as a visual transfer guide.";
const stylePresetPrompts = {
  None: "",
  Cinematic:
    "High-end cinematic still frame, shot on ARRI Alexa 35, high quality prime lens, high dynamic range, shallow depth of field, atmospheric cinematography, high production value, feature film look.",
  Storyboard:
    "Hand-drawn digital storyboard, line drawing with minimalistic shading, grayscale shading, cinematic composition, production-planning style, loose but intentional drawing, simple tonal blocking, clear visual storytelling. A black and white line drawing. No color. No pencil or charcoal sketches. No text or numbers unless described. No frame boarders.",
  Commercial:
    "Polished commercial image, premium advertising style, clean composition, bright refined lighting, shallow depth of field, elevated brand look, modern campaign aesthetic, crisp details, visually appealing.",
  Anime:
    "Stylized anime illustration, clean linework, expressive design, cinematic art lighting, vibrant controlled color palette, detailed background art, dynamic framing, polished animated look, emotionally engaging atmosphere.",
  Claymation:
    "Handmade claymation style, stop-motion look, sculpted clay characters, environment, and props, tactile surfaces, visible handmade imperfections, miniature set design, soft lighting, charming handcrafted aesthetic.",
  "2D Animation":
    "Clean 2D animation style, bold graphic shapes, smooth color blocking, expressive poses, simplified forms, clear silhouettes, modern animated design, playful and readable composition.",
  "3D Animation":
    "Stylized 3D animation look, polished modeling, soft global illumination, appealing textures, expressive forms, cinematic framing, animated feature quality, clean rendering, vibrant and dimensional.",
  "Dark as Fuk":
    "Haunting atmospheric style, eerie stillness, very disturbing and unsettling mood, quiet tension, ghostly lighting, muted colors, shadows, liminal spaces, subtle surreal details, lonely composition, restrained horror tone, dreamlike unease, beautiful but disturbing visual atmosphere.",
  "Pop as Fuk":
    "Poppy fun style, bright bold colors, playful composition, energetic, upbeat mood, glossy visual polish, cheerful, vibrant contrast, whimsical details, modern campaign-ready look, colorful and instantly engaging, super poppy music video vibes.",
  "Sexy as Fuk":
    "High-fashion edgy style, natural, anatomy allure, elegant sensuality, bare skin, bare anatomy, minimal, sculptural, flattering dramatic lighting, skin highlights, premium fashion photography, magnetic presence, sophisticated mood, form and shape, soft skin texture, risky high fashion, edgy.",
  "Strange as Fuk":
    "Strange surreal style, offbeat visual logic, unexpected shapes, odd proportions, unusual textures, dreamlike atmosphere, slightly unsettling but playful tone, surreal composition, imaginative art direction, weird in a smart and intentional way, strange morphs, unexpected abstract realism."
};
const stylePresetNames = Object.keys(stylePresetPrompts);
const shotPresetPrompts = {
  None: "",
  CU: "A close up shot.",
  MS: "A medium shot.",
  WS: "A wide shot.",
  ECU: "An extreme close up shot.",
  EWS: "An extreme wide shot."
};
const lensPresetPrompts = {
  None: "",
  "18mm": "Shot on a wide 18mm prime lens.",
  "35mm": "Shot on a wide 35mm prime lens.",
  "50mm": "Shot on a 50mm prime lens.",
  "85mm": "Shot on a long 85mm prime lens.",
  "120mm": "Shot on a long 120mm prime lens.",
  Macro: "Shot on a macro probe lens."
};
const typePresetPrompts = {
  None: "",
  "Low Angle": "A low angle shot.",
  "High Angle": "A high angle shot.",
  "Extreme High": "A bird's eye view from extremely high angled shot.",
  "Extreme Low": "A worm's eye view from extremely low angled shot.",
  Portrait: "A portrait shot.",
  Profile: "A profile shot."
};
const shotPresetNames = Object.keys(shotPresetPrompts);
const lensPresetNames = Object.keys(lensPresetPrompts);
const typePresetNames = Object.keys(typePresetPrompts);

const initialNodes = [
  {
    id: "text-1",
    type: "text",
    x: 110,
    y: 108,
    data: {
      title: "Prompt",
      text: "A serene landscape with mountains"
    }
  },
  {
    id: "image-1",
    type: "image",
    x: 110,
    y: 442,
    data: {
      title: "Image"
    }
  },
  {
    id: "image-model-1",
    type: "imageModel",
    x: 620,
    y: 126,
    data: {
      title: "Image Model",
      model: "Nano Banana Pro",
      prompt: "A serene landscape with mountains",
      aspectRatio: "21:9",
      resolution: "2K"
    }
  },
  {
    id: "video-model-1",
    type: "videoModel",
    x: 1138,
    y: 44,
    data: {
      title: "Video Model",
      model: "Seedance 2.0",
      prompt: "A beautiful sunset over a calm ocean",
      duration: "15 seconds",
      resolution: "720p",
      aspectRatio: "16:9 (Landscape)",
      generateAudio: true
    }
  }
];

const initialEdges = [
  { id: "edge-1", from: { nodeId: "text-1", port: "promptOut" }, to: { nodeId: "image-model-1", port: "promptIn" }, color: portColors.prompt },
  { id: "edge-2", from: { nodeId: "image-1", port: "imageOut" }, to: { nodeId: "image-model-1", port: "imagePromptIn" }, color: portColors.image }
];

const sceneSize = 3200;
const minZoom = 0.35;
const maxZoom = 1.9;
const nodeDraftStorageKey = "seedance-node-editor-draft-v1";
const previewBaseWidth = 330;

export default function NodeEditor() {
  const canvasRef = React.useRef(null);
  const projectMenuRef = React.useRef(null);
  const undoStackRef = React.useRef([]);
  const clipboardRef = React.useRef(null);
  const savedDraft = React.useMemo(loadNodeEditorDraft, []);
  const [nodes, setNodes] = React.useState(savedDraft.nodes);
  const [edges, setEdges] = React.useState(savedDraft.edges);
  const [dragState, setDragState] = React.useState(null);
  const [draftEdge, setDraftEdge] = React.useState(null);
  const [portPositions, setPortPositions] = React.useState({});
  const [viewport, setViewport] = React.useState(savedDraft.viewport);
  const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);
  const [projectName, setProjectName] = React.useState(savedDraft.projectName);
  const [projectId, setProjectId] = React.useState(savedDraft.projectId);
  const [savedProjectName, setSavedProjectName] = React.useState(savedDraft.savedProjectName);
  const [projects, setProjects] = React.useState([]);
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [toolbarCollapsed, setToolbarCollapsed] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState("");
  const [compilingTransferNodeId, setCompilingTransferNodeId] = React.useState(null);

  const incomingByNode = React.useMemo(() => buildIncomingByNode(nodes, edges), [nodes, edges]);
  const connectedPortKeys = React.useMemo(() => buildConnectedPortKeys(edges), [edges]);
  const selectedNodeSet = React.useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const selectedProjectName = projects.find((project) => project.id === projectId)?.name;

  React.useLayoutEffect(() => {
    updatePortPositions();
  }, [nodes, viewport]);

  React.useEffect(() => {
    loadProjects();
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        nodeDraftStorageKey,
        JSON.stringify({
          nodes,
          edges,
          viewport,
          projectId,
          projectName,
          savedProjectName
        })
      );
    } catch {
      // Local persistence should never interrupt the node editor.
    }
  }, [nodes, edges, viewport, projectId, projectName, savedProjectName]);

  React.useEffect(() => {
    const handleResize = () => updatePortPositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewport]);

  React.useEffect(() => {
    function handleKeyDown(event) {
      const commandKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (commandKey && key === "s") {
        event.preventDefault();
        saveProject();
        return;
      }

      if (event.target.closest?.("input, textarea, select")) return;

      if (commandKey && key === "z") {
        event.preventDefault();
        undoGraphChange();
        return;
      }

      if (commandKey && key === "c") {
        event.preventDefault();
        copySelection();
        return;
      }

      if (commandKey && key === "v") {
        event.preventDefault();
        pasteSelection();
        return;
      }

      if (!selectedNodeIds.length) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeNodes(selectedNodeIds);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, nodes, edges, viewport, projectId, projectName, savedProjectName, selectedProjectName]);

  React.useEffect(() => {
    function handlePointerDown(event) {
      if (!projectMenuRef.current?.contains(event.target)) {
        setProjectMenuOpen(false);
      }
      if (!event.target.closest?.(".node-context-menu")) {
        setContextMenu(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handleWheel(event) {
      handleCanvasWheel(event);
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  React.useEffect(() => {
    function blockPagePinchOutsideCanvas(event) {
      if (!event.ctrlKey && !event.metaKey) return;

      const canvas = canvasRef.current;
      if (canvas?.contains(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
    }

    function blockBrowserGestureOutsideCanvas(event) {
      const canvas = canvasRef.current;
      if (canvas?.contains(event.target)) return;

      event.preventDefault();
      event.stopPropagation();
    }

    window.addEventListener("wheel", blockPagePinchOutsideCanvas, { passive: false, capture: true });
    window.addEventListener("gesturestart", blockBrowserGestureOutsideCanvas, { passive: false, capture: true });
    window.addEventListener("gesturechange", blockBrowserGestureOutsideCanvas, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", blockPagePinchOutsideCanvas, { capture: true });
      window.removeEventListener("gesturestart", blockBrowserGestureOutsideCanvas, { capture: true });
      window.removeEventListener("gesturechange", blockBrowserGestureOutsideCanvas, { capture: true });
    };
  }, []);

  function updatePortPositions() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const nextPositions = {};
    canvas.querySelectorAll("[data-port-key]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      nextPositions[element.dataset.portKey] = {
        x: (rect.left - canvasRect.left + rect.width / 2 - viewport.x) / viewport.scale,
        y: (rect.top - canvasRect.top + rect.height / 2 - viewport.y) / viewport.scale
      };
    });
    setPortPositions(nextPositions);
  }

  function addNode(type, position) {
    const count = nodes.filter((node) => node.type === type).length + 1;
    const spec = nodeCatalog.find((item) => item.type === type);
    pushUndoSnapshot();
    setNodes((current) => [
      ...current,
      {
        id: `${type}-${Date.now()}`,
        type,
        x: position?.x ?? 180 + count * 28,
        y: position?.y ?? 160 + count * 24,
        data: createDefaultNodeData(type, spec?.label || "Node", count)
      }
    ]);
    setContextMenu(null);
  }

  function removeNode(nodeId) {
    removeNodes([nodeId]);
  }

  function removeNodes(nodeIds) {
    if (!nodeIds.length) return;
    pushUndoSnapshot();
    const ids = new Set(nodeIds);
    setNodes((current) => current.filter((node) => !ids.has(node.id)));
    setEdges((current) => current.filter((edge) => !ids.has(edge.from.nodeId) && !ids.has(edge.to.nodeId)));
    setSelectedNodeIds((current) => current.filter((id) => !ids.has(id)));
  }

  function updateNode(nodeId, patch) {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch
              }
            }
          : node
      )
    );
  }

  async function uploadMediaAsset(node, file) {
    if (!file) return;

    pushUndoSnapshot();
    updateNode(node.id, {
      fileName: file.name,
      status: "uploading",
      error: "",
      resultUrl: ""
    });

    const form = new FormData();
    form.append("asset", file);
    form.append("nodeType", node.type);

    try {
      const response = await fetch("/api/node/upload-asset", {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");

      updateNode(node.id, {
        fileName: data.asset.fileName,
        storedFileName: data.asset.storedFileName,
        mimeType: data.asset.mimeType,
        mediaType: data.asset.mediaType,
        resultUrl: data.asset.localUrl,
        status: "ready",
        error: ""
      });
    } catch (error) {
      updateNode(node.id, {
        status: "error",
        error: error.message
      });
    }
  }

  async function uploadTransferImages(node, fileList) {
    if (node.data.locked) return;

    const existingImages = Array.isArray(node.data.transferImages) ? node.data.transferImages : [];
    const files = Array.from(fileList || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, maxTransferImages - existingImages.length);

    if (!files.length) return;

    pushUndoSnapshot();
    updateNode(node.id, {
      status: "uploading",
      error: "",
      activated: false,
      resultUrl: ""
    });

    try {
      const uploadedImages = [];
      for (const file of files) {
        const form = new FormData();
        form.append("asset", file);
        form.append("nodeType", "transfer");

        const response = await fetch("/api/node/upload-asset", {
          method: "POST",
          body: form
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed.");

        uploadedImages.push({
          id: `transfer-image-${Date.now()}-${uploadedImages.length}`,
          fileName: data.asset.fileName,
          storedFileName: data.asset.storedFileName,
          mimeType: data.asset.mimeType,
          localUrl: data.asset.localUrl
        });
      }

      updateNode(node.id, {
        transferImages: [...existingImages, ...uploadedImages].slice(0, maxTransferImages),
        status: "ready",
        error: ""
      });
    } catch (error) {
      updateNode(node.id, {
        status: "error",
        error: error.message
      });
    }
  }

  function removeTransferImage(nodeId, imageId) {
    pushUndoSnapshot();
    updateNode(nodeId, {
      transferImages: nodes.find((node) => node.id === nodeId)?.data.transferImages?.filter((image) => image.id !== imageId) || [],
      activated: false,
      locked: false,
      resultUrl: "",
      fileName: "",
      error: ""
    });
    setEdges((current) => current.filter((edge) => edge.from.nodeId !== nodeId));
  }

  function startPreviewResize(event, node) {
    event.preventDefault();
    event.stopPropagation();
    pushUndoSnapshot();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointer = screenToScene(event.clientX, event.clientY);
    setDragState({
      type: "previewResize",
      nodeId: node.id,
      startPointer: pointer,
      startScale: Number(node.data.previewScale || 1)
    });
  }

  async function activateTransferNode(node) {
    const transferImages = Array.isArray(node.data.transferImages) ? node.data.transferImages.filter((image) => image.localUrl) : [];
    if (!transferImages.length) {
      updateNode(node.id, { error: "Upload at least one image." });
      return;
    }

    try {
      setCompilingTransferNodeId(node.id);
      updateNode(node.id, { status: "compiling", error: "" });
      const collageBlob = await createTransferCollageBlob(transferImages);
      const transferFile = new File([collageBlob], "TRANSFER.png", { type: "image/png" });
      const form = new FormData();
      form.append("asset", transferFile);
      form.append("nodeId", node.id);

      const response = await fetch("/api/node/upload-transfer-collage", {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not compile TRANSFER.png.");

      pushUndoSnapshot();
      updateNode(node.id, {
        activated: true,
        locked: true,
        resultUrl: data.asset.localUrl,
        fileName: data.asset.fileName,
        storedFileName: data.asset.storedFileName,
        mimeType: data.asset.mimeType,
        hiddenPrompt: transferPromptSuffix,
        status: "ready",
        error: ""
      });
    } catch (error) {
      updateNode(node.id, { status: "error", error: error.message });
    } finally {
      setCompilingTransferNodeId(null);
    }
  }

  function unlockTransferNode(nodeId) {
    pushUndoSnapshot();
    updateNode(nodeId, {
      activated: false,
      locked: false,
      resultUrl: "",
      fileName: "",
      status: "ready",
      error: ""
    });
    setEdges((current) => current.filter((edge) => edge.from.nodeId !== nodeId));
  }

  function startNodeDrag(event, node) {
    if (event.target.closest("input, textarea, select, button, label, .preview-resize-handle")) return;
    event.stopPropagation();
    const selectedIds = selectNodeForDrag(node.id, event.shiftKey);
    pushUndoSnapshot();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointer = screenToScene(event.clientX, event.clientY);
    setDragState({
      type: "nodes",
      startPointer: pointer,
      nodes: nodes
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          x: item.x,
          y: item.y
        }))
    });
  }

  function handlePointerMove(event) {
    const pointer = screenToScene(event.clientX, event.clientY);

    if (dragState?.type === "nodes") {
      const deltaX = pointer.x - dragState.startPointer.x;
      const deltaY = pointer.y - dragState.startPointer.y;
      const dragged = new Map(dragState.nodes.map((item) => [item.id, item]));
      setNodes((current) =>
        current.map((node) => {
          const start = dragged.get(node.id);
          return start
            ? {
                ...node,
                x: Math.max(20, start.x + deltaX),
                y: Math.max(20, start.y + deltaY)
              }
            : node;
        })
      );
    }

    if (dragState?.type === "marquee") {
      const rect = normalizeRect(dragState.start, pointer);
      const selected = nodes
        .filter((node) => rectsIntersect(rect, getNodeBounds(node.id)))
        .map((node) => node.id);
      setDragState((current) => (current?.type === "marquee" ? { ...current, current: pointer } : current));
      setSelectedNodeIds([...new Set([...dragState.baseSelection, ...selected])]);
    }

    if (dragState?.type === "previewResize") {
      const deltaX = pointer.x - dragState.startPointer.x;
      const deltaY = pointer.y - dragState.startPointer.y;
      const nextScale = clamp(dragState.startScale + Math.max(deltaX, deltaY) / previewBaseWidth, 1, 3);
      updateNode(dragState.nodeId, { previewScale: roundPreviewScale(nextScale) });
    }

    if (draftEdge) {
      setDraftEdge((current) => ({
        ...current,
        x: pointer.x,
        y: pointer.y
      }));
    }
  }

  function stopNodeDrag() {
    setDragState(null);
  }

  function selectNodeForDrag(nodeId, shouldAdd) {
    let nextSelected;
    if (shouldAdd) {
      nextSelected = selectedNodeSet.has(nodeId) ? selectedNodeIds : [...selectedNodeIds, nodeId];
    } else {
      nextSelected = selectedNodeSet.has(nodeId) ? selectedNodeIds : [nodeId];
    }

    setSelectedNodeIds(nextSelected);
    return nextSelected;
  }

  function startCanvasPointerDown(event) {
    if (event.target !== event.currentTarget && !event.target.classList.contains("node-scene")) return;
    setContextMenu(null);
    const pointer = screenToScene(event.clientX, event.clientY);

    if (event.shiftKey) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState({
        type: "marquee",
        start: pointer,
        current: pointer,
        baseSelection: selectedNodeIds
      });
      return;
    }

    setSelectedNodeIds([]);
  }

  function openCanvasContextMenu(event) {
    if (event.target.closest("[data-node-card-id]")) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setContextMenu({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      scene: screenToScene(event.clientX, event.clientY)
    });
  }

  function startConnection(event, nodeId, port, color) {
    event.preventDefault();
    event.stopPropagation();
    const pointer = screenToScene(event.clientX, event.clientY);
    const startPoint = getPortPoint(nodeId, port);
    setDraftEdge({
      from: { nodeId, port },
      color,
      start: startPoint,
      x: pointer.x,
      y: pointer.y
    });
  }

  function disconnectInputPort(event, nodeId, port) {
    event.preventDefault();
    event.stopPropagation();
    pushUndoSnapshot();
    setEdges((current) => current.filter((edge) => !(edge.to.nodeId === nodeId && edge.to.port === port)));
    setDraftEdge(null);
    setSaveStatus("Disconnected input");
  }

  function handleCanvasWheel(event) {
    const isInteractiveControl = event.target.closest("input, textarea, select");
    if (isInteractiveControl && !event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    if (event.ctrlKey || event.metaKey) {
      setViewport((current) => {
        const zoomFactor = Math.exp(-event.deltaY * 0.003);
        const nextScale = clamp(current.scale * zoomFactor, minZoom, maxZoom);
        const scenePoint = {
          x: (pointer.x - current.x) / current.scale,
          y: (pointer.y - current.y) / current.scale
        };

        return {
          x: pointer.x - scenePoint.x * nextScale,
          y: pointer.y - scenePoint.y * nextScale,
          scale: nextScale
        };
      });
      return;
    }

    setViewport((current) => ({
      ...current,
      x: current.x - event.deltaX,
      y: current.y - event.deltaY
    }));
  }

  function screenToScene(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.scale,
      y: (clientY - rect.top - viewport.y) / viewport.scale
    };
  }

  function getNodeBounds(nodeId) {
    const canvas = canvasRef.current;
    const element = canvas?.querySelector(`[data-node-card-id="${nodeId}"]`);
    if (!canvas || !element) return { left: 0, top: 0, right: 0, bottom: 0 };

    const canvasRect = canvas.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      left: (rect.left - canvasRect.left - viewport.x) / viewport.scale,
      top: (rect.top - canvasRect.top - viewport.y) / viewport.scale,
      right: (rect.right - canvasRect.left - viewport.x) / viewport.scale,
      bottom: (rect.bottom - canvasRect.top - viewport.y) / viewport.scale
    };
  }

  function finishConnection(event) {
    if (dragState?.type === "marquee") {
      stopNodeDrag();
      return;
    }

    if (!draftEdge) {
      stopNodeDrag();
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-port-role='input']");
    if (target) {
      const to = {
        nodeId: target.dataset.nodeId,
        port: target.dataset.portId
      };

      if (to.nodeId !== draftEdge.from.nodeId) {
        const connectionError = getConnectionError(draftEdge.from, to);
        if (connectionError) {
          setSaveStatus(connectionError);
          setDraftEdge(null);
          stopNodeDrag();
          return;
        }

        pushUndoSnapshot();
        setEdges((current) => {
          let nextEdges = current.filter(
            (edge) => !(edge.from.nodeId === draftEdge.from.nodeId && edge.from.port === draftEdge.from.port && edge.to.nodeId === to.nodeId && edge.to.port === to.port)
          );

          return [
            ...nextEdges,
            {
              id: `edge-${Date.now()}`,
              from: draftEdge.from,
              to,
              color: draftEdge.color
            }
          ];
        });
      }
    }

    setDraftEdge(null);
    stopNodeDrag();
  }

  function canCreateEdge(from, to) {
    return !getConnectionError(from, to);
  }

  function getConnectionError(from, to) {
    const source = nodes.find((node) => node.id === from.nodeId);
    const target = nodes.find((node) => node.id === to.nodeId);

    if (!source || !target) return "Choose a valid connection";

    if (source.type === "camera") {
      if (!hasCameraPreset(source)) return "Choose a Camera preset before connecting";
      if (target.type === "imageModel" && to.port === "cameraIn") return "";
      return "Camera connects to the Image Model camera input";
    }

    if (source?.type === "style") {
      if ((source.data.stylePreset || "None") === "None") return "Choose a Style preset before connecting";
      if (target.type === "imageModel" && to.port === "styleIn") return "";
      return "Style presets connect to the Image Model style input";
    }

    if (source.type === "transfer") {
      if (!source.data.activated || !source.data.resultUrl) return "Lock Transfer to enable TRANSFER.png output";
      if ((target.type === "imageModel" && to.port === "transferIn") || (target.type === "preview" && to.port === "sourceIn")) return "";
      return "Transfer connects to the Image Model transfer input or previews";
    }

    if (target?.type === "preview") {
      if (["image", "video", "imageModel", "videoModel", "transfer"].includes(source?.type)) return "";
      return "Preview accepts image and video sources";
    }

    return "";
  }

  function getPortPoint(nodeId, port) {
    return portPositions[`${nodeId}:${port}`] || { x: 0, y: 0 };
  }

  function pushUndoSnapshot() {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-39),
      cloneGraphState({ nodes, edges, viewport, selectedNodeIds })
    ];
  }

  function undoGraphChange() {
    const previous = undoStackRef.current.pop();
    if (!previous) {
      setSaveStatus("Nothing to undo");
      return;
    }

    setNodes(previous.nodes);
    setEdges(previous.edges);
    setViewport(previous.viewport);
    setSelectedNodeIds(previous.selectedNodeIds);
    setSaveStatus("Undone");
  }

  function copySelection() {
    if (!selectedNodeIds.length) return;

    const ids = new Set(selectedNodeIds);
    clipboardRef.current = {
      nodes: nodes.filter((node) => ids.has(node.id)).map((node) => cloneNode(node)),
      edges: edges.filter((edge) => ids.has(edge.from.nodeId) && ids.has(edge.to.nodeId)).map((edge) => cloneEdge(edge))
    };
    setSaveStatus(`${selectedNodeIds.length} node${selectedNodeIds.length === 1 ? "" : "s"} copied`);
  }

  function pasteSelection() {
    const clipboard = clipboardRef.current;
    if (!clipboard?.nodes?.length) return;

    pushUndoSnapshot();
    const stamp = Date.now();
    const idMap = new Map();
    const pastedNodes = clipboard.nodes.map((node, index) => {
      const nextId = `${node.type}-${stamp}-${index}`;
      const nextNode = cloneNode(node);
      idMap.set(node.id, nextId);
      return {
        ...nextNode,
        id: nextId,
        x: node.x + 42,
        y: node.y + 42,
        data: {
          ...nextNode.data,
          title: `${node.data.title || node.type} Copy`
        }
      };
    });
    const pastedEdges = clipboard.edges
      .filter((edge) => idMap.has(edge.from.nodeId) && idMap.has(edge.to.nodeId))
      .map((edge, index) => ({
        ...cloneEdge(edge),
        id: `edge-${stamp}-${index}`,
        from: {
          ...edge.from,
          nodeId: idMap.get(edge.from.nodeId)
        },
        to: {
          ...edge.to,
          nodeId: idMap.get(edge.to.nodeId)
        }
      }));

    setNodes((current) => [...current, ...pastedNodes]);
    setEdges((current) => [...current, ...pastedEdges]);
    setSelectedNodeIds(pastedNodes.map((node) => node.id));
    setSaveStatus(`${pastedNodes.length} node${pastedNodes.length === 1 ? "" : "s"} pasted`);
  }

  async function loadProjects() {
    try {
      const response = await fetch("/api/node-projects");
      if (!response.ok) throw new Error("Could not load saved projects.");
      const projectList = await response.json();
      setProjects(projectList);
      if (projectId && !savedProjectName) {
        const currentProject = projectList.find((project) => project.id === projectId);
        if (currentProject?.name) setSavedProjectName(currentProject.name);
      }
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function saveProject() {
    try {
      const cleanProjectName = String(projectName || "").trim() || "Untitled node project";
      const lastSavedName = String(savedProjectName || selectedProjectName || "").trim();
      const shouldCreateNewProject = Boolean(projectId && lastSavedName && cleanProjectName !== lastSavedName);

      setSaveStatus("Saving...");
      const response = await fetch("/api/node-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shouldCreateNewProject ? null : projectId,
          name: cleanProjectName,
          nodes,
          edges,
          viewport
        })
      });
      const project = await response.json();
      if (!response.ok) throw new Error(project.error || "Could not save project.");
      setProjectId(project.id);
      setProjectName(project.name);
      setSavedProjectName(project.name);
      setSaveStatus(shouldCreateNewProject ? "Saved as new project" : "Saved");
      await loadProjects();
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function loadProject(id) {
    if (!id) return;

    try {
      const response = await fetch(`/api/node-projects/${encodeURIComponent(id)}`);
      const project = await response.json();
      if (!response.ok) throw new Error(project.error || "Could not load project.");
      const graph = normalizeEditorGraph(project.graph.nodes || [], project.graph.edges || []);
      setProjectId(project.id);
      setProjectName(project.name);
      setSavedProjectName(project.name);
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setViewport(project.graph.viewport || { x: 0, y: 0, scale: 1 });
      setSelectedNodeIds([]);
      setProjectMenuOpen(false);
      setSaveStatus("Loaded");
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete "${project.name}"?`)) return;

    try {
      const response = await fetch(`/api/node-projects/${encodeURIComponent(project.id)}`, {
        method: "DELETE"
      });
      const nextProjects = await response.json();
      if (!response.ok) throw new Error(nextProjects.error || "Could not delete project.");
      setProjects(nextProjects);
      if (projectId === project.id) {
        setProjectId(null);
        setProjectName("Untitled node project");
        setSavedProjectName(null);
      }
      setProjectMenuOpen(false);
      setSaveStatus("Project deleted");
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function runNode(node) {
    if (node.type !== "imageModel" && node.type !== "videoModel") return;
    if (node.data.status === "running") return;

    const incoming = incomingByNode[node.id] || {};
    const basePrompt = connectedText(incoming.promptIn) || node.data.prompt;

    try {
      updateNode(node.id, { status: "running", error: "" });

      if (node.type === "imageModel") {
        const imagePromptItems = connectedImagePromptItems([...(incoming.imagePromptIn || []), ...(incoming.transferIn || [])]);
        const prompt = buildEffectiveImagePrompt(basePrompt, [...(incoming.cameraIn || []), ...(incoming.styleIn || []), ...(incoming.transferIn || [])], node.data.aspectRatio);
        const response = await fetch("/api/node/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: node.data.model,
            aspectRatio: node.data.aspectRatio,
            resolution: node.data.resolution,
            imagePromptUrls: imagePromptItems.map((item) => item.url),
            imagePromptLabels: imagePromptItems.map((item) => item.label),
            projectId,
            projectName,
            nodeId: node.id,
            nodeTitle: node.data.title
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Image generation failed.");
        updateNode(node.id, {
          status: "complete",
          resultUrl: data.image.localUrl,
          resultText: data.text || "",
          error: ""
        });
        return;
      }

      const prompt = basePrompt;
      const response = await fetch("/api/node/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: node.data.model,
          duration: node.data.duration,
          resolution: node.data.resolution,
          aspectRatio: node.data.aspectRatio,
          generateAudio: node.data.generateAudio,
          startFrameUrls: connectedAssetUrls(incoming.startFrameIn),
          endFrameUrls: connectedAssetUrls(incoming.endFrameIn),
          referenceImageUrls: connectedAssetUrls(incoming.referenceImageIn),
          referenceVideoUrls: connectedAssetUrls(incoming.referenceVideoIn),
          referenceAudioUrls: connectedAssetUrls(incoming.referenceAudioIn),
          projectId,
          projectName,
          nodeId: node.id,
          nodeTitle: node.data.title
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video generation failed.");
      updateNode(node.id, {
        status: "complete",
        resultUrl: data.video.localUrl,
        resultText: "",
        error: ""
      });
    } catch (error) {
      updateNode(node.id, { status: "error", error: error.message });
    }
  }

  return (
    <section className={`node-workspace ${toolbarCollapsed ? "toolbar-collapsed" : ""}`}>
      {toolbarCollapsed && (
        <button className="sidebar-restore" onClick={() => setToolbarCollapsed(false)} title="Show node palette">
          <PanelLeftOpen size={17} />
        </button>
      )}

      <aside className="node-toolbar">
        <div className="toolbar-header">
          <span>Nodes</span>
          <button className="sidebar-hide" onClick={() => setToolbarCollapsed(true)} title="Hide node palette">
            <PanelLeftClose size={16} />
          </button>
        </div>
        <div className="project-tools">
          <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" />
          <button onClick={saveProject} title="Save project">
            <Save size={16} />
            <span>Save</span>
          </button>
          <div className="project-picker" ref={projectMenuRef}>
            <button className="project-picker-trigger" onClick={() => setProjectMenuOpen((open) => !open)} title="Load saved project">
              <span>{selectedProjectName || "Load project"}</span>
              <ChevronDown size={13} />
            </button>
            {projectMenuOpen && (
              <div className="project-menu">
                {projects.length ? (
                  projects.map((project) => (
                    <div className="project-menu-row" key={project.id}>
                      <button className="project-load" onClick={() => loadProject(project.id)} title={`Load ${project.name}`}>
                        {project.name}
                      </button>
                      <button className="project-delete" onClick={() => deleteProject(project)} title={`Delete ${project.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <small>No saved projects</small>
                )}
              </div>
            )}
          </div>
          {saveStatus && <small>{saveStatus}</small>}
        </div>
        {nodeCatalog.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.type} onClick={() => addNode(item.type)} title={`Add ${item.label}`}>
              <Icon size={17} />
              <span>{item.label}</span>
              <Plus size={14} />
            </button>
          );
        })}
      </aside>

      <div
        ref={canvasRef}
        className="node-canvas"
        onPointerDown={startCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishConnection}
        onPointerCancel={stopNodeDrag}
        onContextMenu={openCanvasContextMenu}
      >
        <div
          className="node-scene"
          style={{
            width: `${sceneSize}px`,
            height: `${sceneSize}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`
          }}
        >
          <svg className="edge-layer" viewBox={`0 0 ${sceneSize} ${sceneSize}`}>
            {edges.map((edge) => {
              const from = getPortPoint(edge.from.nodeId, edge.from.port);
              const to = getPortPoint(edge.to.nodeId, edge.to.port);
              return <EdgePath key={edge.id} from={from} to={to} color={edge.color} />;
            })}
          {draftEdge && <EdgePath from={draftEdge.start} to={{ x: draftEdge.x, y: draftEdge.y }} color={draftEdge.color} draft />}
          {dragState?.type === "marquee" && <SelectionMarquee start={dragState.start} current={dragState.current} />}
          </svg>

          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onDragStart={startNodeDrag}
              onRemove={removeNode}
              onUpdate={updateNode}
              onConnectStart={startConnection}
              onDisconnectInput={disconnectInputPort}
              connectedPortKeys={connectedPortKeys}
              incoming={incomingByNode[node.id] || {}}
              onRun={runNode}
              onUpload={uploadMediaAsset}
              onTransferImagesUpload={uploadTransferImages}
              onTransferImageRemove={removeTransferImage}
              onTransferActivate={activateTransferNode}
              onTransferUnlock={unlockTransferNode}
              onPreviewResizeStart={startPreviewResize}
              running={node.data.status === "running"}
              transferCompiling={compilingTransferNodeId === node.id}
              selected={selectedNodeSet.has(node.id)}
            />
          ))}
        </div>
        {contextMenu && (
          <div className="node-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            {nodeCatalog.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.type} onClick={() => addNode(item.type, contextMenu.scene)}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="zoom-readout">{Math.round(viewport.scale * 100)}%</div>
      </div>
    </section>
  );
}

function EdgePath({ from, to, color, draft }) {
  const curve = Math.max(80, Math.abs(to.x - from.x) * 0.42);
  const path = `M ${from.x} ${from.y} C ${from.x + curve} ${from.y}, ${to.x - curve} ${to.y}, ${to.x} ${to.y}`;
  return <path d={path} stroke={color} strokeWidth={draft ? 3 : 4} fill="none" opacity={draft ? 0.62 : 0.42} strokeLinecap="round" />;
}

function SelectionMarquee({ start, current }) {
  const rect = normalizeRect(start, current);
  return (
    <rect
      className="selection-marquee"
      x={rect.left}
      y={rect.top}
      width={rect.right - rect.left}
      height={rect.bottom - rect.top}
      rx="8"
    />
  );
}

function NodeCard({
  node,
  onDragStart,
  onRemove,
  onUpdate,
  onConnectStart,
  onDisconnectInput,
  connectedPortKeys,
  incoming,
  onRun,
  onUpload,
  onTransferImagesUpload,
  onTransferImageRemove,
  onTransferActivate,
  onTransferUnlock,
  onPreviewResizeStart,
  running,
  transferCompiling,
  selected
}) {
  const config = getNodeConfig(node.type);
  const Icon = config.icon;
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(node.data.title || "");

  React.useEffect(() => {
    if (!editingTitle) {
      setDraftTitle(node.data.title || "");
    }
  }, [node.data.title, editingTitle]);

  function commitTitleEdit() {
    const title = draftTitle.trim() || node.data.title || configTitleFallback(node.type);
    onUpdate(node.id, { title });
    setDraftTitle(title);
    setEditingTitle(false);
  }

  function cancelTitleEdit() {
    setDraftTitle(node.data.title || "");
    setEditingTitle(false);
  }

  return (
    <article
      className={`node-card ${node.type} ${selected ? "selected" : ""}`}
      style={{ transform: `translate(${node.x}px, ${node.y}px)`, "--preview-scale": node.data.previewScale || 1 }}
      data-node-card-id={node.id}
      onPointerDown={(event) => onDragStart(event, node)}
    >
      <div className="node-title">
        <span className="node-title-label">
          <Icon size={15} />
          {editingTitle ? (
            <input
              className="node-title-input"
              value={draftTitle}
              autoFocus
              onPointerDown={(event) => event.stopPropagation()}
              onFocus={(event) => event.target.select()}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitleEdit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelTitleEdit();
                }
              }}
            />
          ) : (
            <span
              className="node-title-name"
              role="button"
              tabIndex={0}
              title="Rename node"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setEditingTitle(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setEditingTitle(true);
                }
              }}
            >
              {node.data.title}
            </span>
          )}
        </span>
        <button onClick={() => onRemove(node.id)} title="Remove node">
          <X size={14} />
        </button>
      </div>

      <NodeBody
        node={node}
        onUpdate={onUpdate}
        incoming={incoming}
        onRun={onRun}
        running={running}
        onConnectStart={onConnectStart}
        onDisconnectInput={onDisconnectInput}
        connectedPortKeys={connectedPortKeys}
        onUpload={onUpload}
        onTransferImagesUpload={onTransferImagesUpload}
        onTransferImageRemove={onTransferImageRemove}
        onTransferActivate={onTransferActivate}
        onTransferUnlock={onTransferUnlock}
        onPreviewResizeStart={onPreviewResizeStart}
        transferCompiling={transferCompiling}
      />
    </article>
  );
}

function PortHandle({ node, port, side, onConnectStart, onDisconnectInput, connectedPortKeys }) {
  const connected = connectedPortKeys.has(`${node.id}:${port.id}`);

  return (
    <button
      className={`inline-port ${side} ${connected ? "connected" : ""}`}
      data-port-role={side}
      data-node-id={node.id}
      data-port-id={port.id}
      data-port-key={`${node.id}:${port.id}`}
      style={{ "--port-color": port.color }}
      onPointerDown={(event) => {
        if (side === "output") {
          onConnectStart(event, node.id, port.id, port.color);
          return;
        }
        onDisconnectInput(event, node.id, port.id);
      }}
      title={side === "input" ? `Disconnect ${port.label}` : `Connect ${port.label}`}
    />
  );
}

function OutputPortRow({ node, port, onConnectStart, onDisconnectInput, connectedPortKeys, label = port.label }) {
  return (
    <div className="port-row output-row">
      <span>{label}</span>
      <PortHandle
        node={node}
        port={port}
        side="output"
        onConnectStart={onConnectStart}
        onDisconnectInput={onDisconnectInput}
        connectedPortKeys={connectedPortKeys}
      />
    </div>
  );
}

function MediaPreview({ node }) {
  if (!node.data.resultUrl) {
    return (
      <div className="media-preview empty">
        <UploadIcon type={node.type} />
        <span>No upload yet</span>
      </div>
    );
  }

  if (node.type === "image") {
    return (
      <div className="media-preview">
        <img src={node.data.resultUrl} alt={node.data.fileName || "Uploaded image"} />
      </div>
    );
  }

  if (node.type === "video") {
    return (
      <div className="media-preview">
        <video src={node.data.resultUrl} controls muted />
      </div>
    );
  }

  return (
    <div className="media-preview audio">
      <FileAudio size={28} />
      <audio src={node.data.resultUrl} controls />
    </div>
  );
}

function StyleCollage({ images, locked, onRemove, onDropImages }) {
  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    onDropImages?.(event.dataTransfer.files);
  }

  if (!images.length) {
    return (
      <div className="style-collage empty" onDragOver={allowFileDrop} onDrop={handleDrop}>
        <Compass size={24} />
        <span>Drop transfer images here</span>
      </div>
    );
  }

  return (
    <div className={`style-collage count-${images.length} ${locked ? "locked" : ""}`} onDragOver={allowFileDrop} onDrop={handleDrop}>
      {images.map((image) => (
        <div className="style-collage-cell" key={image.id}>
          <img src={image.localUrl} alt={image.fileName || "Transfer reference"} />
          {!locked && (
            <button onClick={() => onRemove(image.id)} title="Remove image">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function UploadIcon({ type }) {
  if (type === "image") return <FileImage size={22} />;
  if (type === "video") return <Video size={22} />;
  if (type === "audio") return <FileAudio size={22} />;
  return <Plus size={22} />;
}

function NodeBody({
  node,
  onUpdate,
  incoming,
  onRun,
  running,
  onConnectStart,
  onDisconnectInput,
  connectedPortKeys,
  onUpload,
  onTransferImagesUpload,
  onTransferImageRemove,
  onTransferActivate,
  onTransferUnlock,
  onPreviewResizeStart,
  transferCompiling
}) {
  const config = getNodeConfig(node.type);
  const outputPort = config.output[0];

  if (node.type === "text") {
    return (
      <div className="node-body">
        <OutputPortRow node={node} port={outputPort} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        <textarea value={node.data.text} onChange={(event) => onUpdate(node.id, { text: event.target.value })} />
      </div>
    );
  }

  if (node.type === "image" || node.type === "video" || node.type === "audio") {
    return (
      <div
        className="node-body media-node-body"
        onDragOver={allowFileDrop}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const file = firstAcceptedFile(event.dataTransfer.files, node.type);
          if (file) onUpload(node, file);
        }}
      >
        <OutputPortRow node={node} port={outputPort} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        <MediaPreview node={node} />
        <label className="media-upload-card">
          <UploadIcon type={node.type} />
          <span>{node.data.resultUrl ? "Replace upload" : "Upload"}</span>
          <input type="file" accept={mediaAccept(node.type)} onChange={(event) => onUpload(node, event.target.files?.[0])} />
        </label>
        {node.data.fileName && <small>{node.data.fileName}</small>}
        {node.data.status === "uploading" && <small className="upload-status">Uploading...</small>}
        {node.data.error && <small className="upload-error">{node.data.error}</small>}
      </div>
    );
  }

  if (node.type === "camera") {
    const cameraSelected = hasCameraPreset(node);
    return (
      <div className="node-body style-only-node-body">
        {cameraSelected ? (
          <OutputPortRow node={node} port={outputPort} label={cameraLabel(node)} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        ) : (
          <div className="style-output-placeholder">Choose camera preset to enable output</div>
        )}

        <div className="style-preset-row">
          <span>Shot</span>
          <select value={node.data.shotPreset || "None"} onChange={(event) => onUpdate(node.id, { shotPreset: event.target.value })}>
            {shotPresetNames.map((presetName) => (
              <option key={presetName}>{presetName}</option>
            ))}
          </select>
        </div>
        <div className="style-preset-row">
          <span>Lens</span>
          <select value={node.data.lensPreset || "None"} onChange={(event) => onUpdate(node.id, { lensPreset: event.target.value })}>
            {lensPresetNames.map((presetName) => (
              <option key={presetName}>{presetName}</option>
            ))}
          </select>
        </div>
        <div className="style-preset-row">
          <span>Type</span>
          <select value={node.data.typePreset || "None"} onChange={(event) => onUpdate(node.id, { typePreset: event.target.value })}>
            {typePresetNames.map((presetName) => (
              <option key={presetName}>{presetName}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (node.type === "transfer") {
    const transferImages = Array.isArray(node.data.transferImages) ? node.data.transferImages : [];
    const canAddImages = !node.data.locked && transferImages.length < maxTransferImages;
    return (
      <div className="node-body style-node-body">
        {node.data.activated && node.data.resultUrl ? (
          <OutputPortRow node={node} port={outputPort} label="TRANSFER.png" onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        ) : (
          <div className="style-output-placeholder">Lock transfer to enable output</div>
        )}

        <StyleCollage
          images={transferImages}
          locked={node.data.locked}
          onRemove={(imageId) => onTransferImageRemove(node.id, imageId)}
          onDropImages={(files) => onTransferImagesUpload(node, files)}
        />

        <div className="style-actions">
          <label className={`style-upload-button ${!canAddImages ? "disabled" : ""}`}>
            <FileImage size={16} />
            <span>{transferImages.length ? "Add images" : "Upload images"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={!canAddImages} onChange={(event) => onTransferImagesUpload(node, event.target.files)} />
          </label>
          <button
            className={`style-lock-button ${node.data.locked ? "locked" : ""}`}
            onClick={() => (node.data.locked ? onTransferUnlock(node.id) : onTransferActivate(node))}
            disabled={transferCompiling || (!node.data.locked && !transferImages.length)}
            title={node.data.locked ? "Unlock transfer" : "Compile TRANSFER.png"}
          >
            {node.data.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </div>

        <div className="style-meta">
          <span>{transferImages.length}/{maxTransferImages}</span>
          <span>{transferCompiling ? "Compiling..." : node.data.locked ? "Locked" : "Editable"}</span>
        </div>
        {node.data.fileName && <small>{node.data.fileName}</small>}
        {node.data.status === "uploading" && <small className="upload-status">Uploading...</small>}
        {node.data.error && <small className="upload-error">{node.data.error}</small>}
      </div>
    );
  }

  if (node.type === "style") {
    const selectedPreset = node.data.stylePreset || "None";
    const styleSelected = selectedPreset !== "None";

    return (
      <div className="node-body style-only-node-body">
        {styleSelected ? (
          <OutputPortRow
            node={node}
            port={outputPort}
            label={selectedPreset}
            onConnectStart={onConnectStart}
            onDisconnectInput={onDisconnectInput}
            connectedPortKeys={connectedPortKeys}
          />
        ) : (
          <div className="style-output-placeholder">Choose style to enable output</div>
        )}

        <div className="style-preset-row">
          <span>Style</span>
          <select value={selectedPreset} onChange={(event) => onUpdate(node.id, { stylePreset: event.target.value })}>
            {stylePresetNames.map((presetName) => (
              <option key={presetName}>{presetName}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (node.type === "preview") {
    const previewSource = connectedPreviewSource(incoming.sourceIn);
    const sourcePort = config.input.find((port) => port.id === "sourceIn");
    return (
      <div className="node-body preview-node-body">
        <NodeRow label="Source" inputPort={sourcePort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={previewSource ? "connected-field" : ""}>{previewSource ? previewSource.label : "Connect image or video"}</button>
        </NodeRow>
        <div className={`preview-stage ${previewSource ? "has-preview" : ""}`}>
          {previewSource?.type === "image" && <img src={previewSource.url} alt={previewSource.label} />}
          {previewSource?.type === "video" && <video src={previewSource.url} controls />}
          {!previewSource && <span>Preview will appear here</span>}
        </div>
        <button className="preview-resize-handle" onPointerDown={(event) => onPreviewResizeStart(event, node)} title="Resize preview" />
      </div>
    );
  }

  if (node.type === "imageModel") {
    const promptValue = connectedText(incoming.promptIn) || node.data.prompt;
    const promptConnected = Boolean(connectedText(incoming.promptIn));
    const effectivePromptValue = buildEffectiveImagePrompt(promptValue, [...(incoming.cameraIn || []), ...(incoming.styleIn || []), ...(incoming.transferIn || [])], node.data.aspectRatio);
    const promptHasGeneratedAdditions = effectivePromptValue !== promptValue;
    const imagePromptLabel = connectedSummary(incoming.imagePromptIn, "Add file");
    const cameraPromptLabel = connectedSummary(incoming.cameraIn, "Add camera");
    const stylePromptLabel = connectedSummary(incoming.styleIn, "Add style");
    const transferPromptLabel = connectedSummary(incoming.transferIn, "Add transfer");
    const promptPort = config.input.find((port) => port.id === "promptIn");
    const imagePromptPort = config.input.find((port) => port.id === "imagePromptIn");
    const cameraPort = config.input.find((port) => port.id === "cameraIn");
    const stylePort = config.input.find((port) => port.id === "styleIn");
    const transferPort = config.input.find((port) => port.id === "transferIn");
    return (
      <div className="node-body model-node-body">
        <ResultPane label="Results will appear here" resultUrl={node.data.resultUrl} type="image" status={node.data.status} error={node.data.error} />
        <button className="run-node-button" onClick={() => onRun(node)} disabled={running}>
          {running ? "Running..." : "Run Image"}
        </button>
        <OutputPortRow node={node} port={outputPort} label="Image output" onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        <NodeRow label="Model">
          <select value={node.data.model} onChange={(event) => onUpdate(node.id, { model: event.target.value })}>
            <option>Nano Banana Pro</option>
            <option>OpenAI Image 2</option>
          </select>
        </NodeRow>
        <NodeRow label="Prompt" inputPort={promptPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <textarea className={promptConnected ? "connected-field" : ""} value={promptValue} readOnly={promptConnected} onChange={(event) => onUpdate(node.id, { prompt: event.target.value })} />
        </NodeRow>
        {promptHasGeneratedAdditions && (
          <div className="effective-prompt-preview">
            <span>Camera/style/transfer instructions applied</span>
          </div>
        )}
        <details open>
          <summary>Settings</summary>
          <NodeRow label="Image Prompt" inputPort={imagePromptPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
            <button className={imagePromptLabel !== "Add file" ? "connected-field" : ""}>{imagePromptLabel}</button>
          </NodeRow>
          <NodeRow label="Camera" inputPort={cameraPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
            <button className={cameraPromptLabel !== "Add camera" ? "connected-field" : ""}>{cameraPromptLabel}</button>
          </NodeRow>
          <NodeRow label="Style" inputPort={stylePort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
            <button className={stylePromptLabel !== "Add style" ? "connected-field" : ""}>{stylePromptLabel}</button>
          </NodeRow>
          <NodeRow label="Transfer" inputPort={transferPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
            <button className={transferPromptLabel !== "Add transfer" ? "connected-field" : ""}>{transferPromptLabel}</button>
          </NodeRow>
          <NodeRow label="Aspect Ratio">
            <select value={node.data.aspectRatio} onChange={(event) => onUpdate(node.id, { aspectRatio: event.target.value })}>
              <option>21:9</option>
              <option>16:9</option>
              <option>1:1</option>
              <option>9:16</option>
            </select>
          </NodeRow>
          <NodeRow label="Resolution">
            <select value={node.data.resolution} onChange={(event) => onUpdate(node.id, { resolution: event.target.value })}>
              <option>2K</option>
              <option>1K</option>
              <option>4K</option>
            </select>
          </NodeRow>
        </details>
      </div>
    );
  }

  const promptValue = connectedText(incoming.promptIn) || node.data.prompt;
  const promptConnected = Boolean(connectedText(incoming.promptIn));
  const promptPort = config.input.find((port) => port.id === "promptIn");
  const startFramePort = config.input.find((port) => port.id === "startFrameIn");
  const endFramePort = config.input.find((port) => port.id === "endFrameIn");
  const referenceImagePort = config.input.find((port) => port.id === "referenceImageIn");
  const referenceVideoPort = config.input.find((port) => port.id === "referenceVideoIn");
  const referenceAudioPort = config.input.find((port) => port.id === "referenceAudioIn");
  return (
    <div className="node-body model-node-body">
      <ResultPane label="Results will appear here" resultUrl={node.data.resultUrl} type="video" status={node.data.status} error={node.data.error} />
      <button className="run-node-button" onClick={() => onRun(node)} disabled={running}>
        {running ? "Running..." : "Run Video"}
      </button>
      <OutputPortRow node={node} port={outputPort} label="Video output" onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
      <NodeRow label="Model">
        <select value={node.data.model} onChange={(event) => onUpdate(node.id, { model: event.target.value })}>
          <option>Seedance 2.0</option>
          <option>Seedance 2.0 Fast</option>
        </select>
      </NodeRow>
      <NodeRow label="Prompt" inputPort={promptPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
        <textarea className={promptConnected ? "connected-field" : ""} value={promptValue} readOnly={promptConnected} onChange={(event) => onUpdate(node.id, { prompt: event.target.value })} />
      </NodeRow>
      <details open>
        <summary>Settings</summary>
        <NodeRow label="Start Frame" inputPort={startFramePort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={incoming.startFrameIn?.length ? "connected-field" : ""}>{connectedSummary(incoming.startFrameIn, "Add file")}</button>
        </NodeRow>
        <NodeRow label="End Frame" inputPort={endFramePort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={incoming.endFrameIn?.length ? "connected-field" : ""}>{connectedSummary(incoming.endFrameIn, "Add file")}</button>
        </NodeRow>
        <NodeRow label="Reference Image" inputPort={referenceImagePort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={incoming.referenceImageIn?.length ? "connected-field" : ""}>{connectedSummary(incoming.referenceImageIn, "Add file")}</button>
        </NodeRow>
        <NodeRow label="Reference Video" inputPort={referenceVideoPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={incoming.referenceVideoIn?.length ? "connected-field" : ""}>{connectedSummary(incoming.referenceVideoIn, "Add file")}</button>
        </NodeRow>
        <NodeRow label="Reference Audio" inputPort={referenceAudioPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <button className={incoming.referenceAudioIn?.length ? "connected-field" : ""}>{connectedSummary(incoming.referenceAudioIn, "Add file")}</button>
        </NodeRow>
        <NodeRow label="Duration">
          <select value={node.data.duration} onChange={(event) => onUpdate(node.id, { duration: event.target.value })}>
            <option>15 seconds</option>
            <option>10 seconds</option>
            <option>5 seconds</option>
          </select>
        </NodeRow>
        <NodeRow label="Resolution">
          <select value={node.data.resolution} onChange={(event) => onUpdate(node.id, { resolution: event.target.value })}>
            <option>720p</option>
            <option>480p</option>
            <option>1080p</option>
          </select>
        </NodeRow>
        <NodeRow label="Aspect Ratio">
          <select value={node.data.aspectRatio} onChange={(event) => onUpdate(node.id, { aspectRatio: event.target.value })}>
            <option>16:9 (Landscape)</option>
            <option>21:9</option>
            <option>9:16 (Portrait)</option>
            <option>1:1</option>
          </select>
        </NodeRow>
        <NodeRow label="Generate Audio">
          <button className={`node-toggle ${node.data.generateAudio ? "enabled" : ""}`} onClick={() => onUpdate(node.id, { generateAudio: !node.data.generateAudio })}>
            <span />
          </button>
        </NodeRow>
      </details>
    </div>
  );
}

function ResultPane({ label, resultUrl, type, status, error }) {
  return (
    <div className={`result-pane ${resultUrl ? "has-result" : ""}`}>
      {resultUrl && type === "image" && <img src={resultUrl} alt="Generated image" />}
      {resultUrl && type === "video" && <video src={resultUrl} controls />}
      {!resultUrl && <span>{status === "running" ? "Running..." : label}</span>}
      {error && <small>{error}</small>}
    </div>
  );
}

function NodeRow({ label, children, inputPort, node, onConnectStart, onDisconnectInput, connectedPortKeys }) {
  return (
    <div className={`node-row ${inputPort ? "has-port" : ""}`}>
      <span className="node-row-label">
        {inputPort && (
          <PortHandle
            node={node}
            port={inputPort}
            side="input"
            onConnectStart={onConnectStart}
            onDisconnectInput={onDisconnectInput}
            connectedPortKeys={connectedPortKeys}
          />
        )}
        <span>{label}</span>
      </span>
      {children}
    </div>
  );
}

function getNodeConfig(type) {
  const configs = {
    text: {
      icon: Type,
      input: [],
      output: [{ id: "promptOut", label: "Prompt", color: portColors.prompt }]
    },
    image: {
      icon: FileImage,
      input: [],
      output: [{ id: "imageOut", label: "Image", color: portColors.image }]
    },
    camera: {
      icon: Camera,
      input: [],
      output: [{ id: "cameraOut", label: "Camera", color: portColors.camera }]
    },
    style: {
      icon: Palette,
      input: [],
      output: [{ id: "styleOut", label: "Style", color: portColors.style }]
    },
    transfer: {
      icon: Compass,
      input: [],
      output: [{ id: "transferOut", label: "TRANSFER.png", color: portColors.transfer }]
    },
    video: {
      icon: Video,
      input: [],
      output: [{ id: "videoOut", label: "Video", color: portColors.video }]
    },
    audio: {
      icon: FileAudio,
      input: [],
      output: [{ id: "audioOut", label: "Audio", color: portColors.audio }]
    },
    preview: {
      icon: MonitorPlay,
      input: [{ id: "sourceIn", label: "Source", color: portColors.preview }],
      output: []
    },
    imageModel: {
      icon: ImagePlus,
      input: [
        { id: "promptIn", label: "Prompt", color: portColors.prompt },
        { id: "imagePromptIn", label: "Image Prompt", color: portColors.image },
        { id: "cameraIn", label: "Camera", color: portColors.camera },
        { id: "styleIn", label: "Style", color: portColors.style },
        { id: "transferIn", label: "Transfer", color: portColors.transfer }
      ],
      output: [{ id: "imageOut", label: "Image", color: portColors.image }]
    },
    videoModel: {
      icon: Film,
      input: [
        { id: "promptIn", label: "Prompt", color: portColors.prompt },
        { id: "startFrameIn", label: "Start Frame", color: portColors.image },
        { id: "endFrameIn", label: "End Frame", color: portColors.image },
        { id: "referenceImageIn", label: "Reference Image", color: portColors.image },
        { id: "referenceVideoIn", label: "Reference Video", color: portColors.video },
        { id: "referenceAudioIn", label: "Reference Audio", color: portColors.audio }
      ],
      output: [{ id: "videoOut", label: "Video", color: portColors.video }]
    }
  };

  return configs[type];
}

function createDefaultNodeData(type, label, count) {
  const title = `${label}${count > 1 ? ` ${count}` : ""}`;

  if (type === "text") return { title, text: "" };
  if (type === "image" || type === "video" || type === "audio") return { title };
  if (type === "preview") return { title, previewScale: 1 };
  if (type === "camera") {
    return {
      title,
      shotPreset: "None",
      lensPreset: "None",
      typePreset: "None"
    };
  }
  if (type === "transfer") {
    return {
      title,
      transferImages: [],
      activated: false,
      locked: false,
      hiddenPrompt: transferPromptSuffix
    };
  }
  if (type === "style") return { title, stylePreset: "None" };
  if (type === "imageModel") {
    return {
      title,
      model: "Nano Banana Pro",
      prompt: "",
      aspectRatio: "21:9",
      resolution: "2K"
    };
  }

  return {
    title,
    model: "Seedance 2.0",
    prompt: "",
    duration: "15 seconds",
    resolution: "720p",
    aspectRatio: "16:9 (Landscape)",
    generateAudio: true
  };
}

function configTitleFallback(type) {
  return nodeCatalog.find((item) => item.type === type)?.label || "Node";
}

function mediaAccept(type) {
  if (type === "image") return "image/png,image/jpeg,image/webp";
  if (type === "video") return "video/mp4,video/quicktime,video/webm";
  return "audio/mpeg,audio/wav,audio/mp4";
}

function allowFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();
}

function firstAcceptedFile(fileList, type) {
  const files = Array.from(fileList || []);
  if (type === "image") return files.find((file) => file.type.startsWith("image/"));
  if (type === "video") return files.find((file) => file.type.startsWith("video/"));
  if (type === "audio") return files.find((file) => file.type.startsWith("audio/"));
  return files[0];
}

function buildIncomingByNode(nodes, edges) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return edges.reduce((incoming, edge) => {
    const source = nodeMap.get(edge.from.nodeId);
    if (!source) return incoming;
    incoming[edge.to.nodeId] ||= {};
    incoming[edge.to.nodeId][edge.to.port] ||= [];
    incoming[edge.to.nodeId][edge.to.port].push({ edge, source });
    return incoming;
  }, {});
}

function buildConnectedPortKeys(edges) {
  const keys = new Set();
  edges.forEach((edge) => {
    keys.add(`${edge.from.nodeId}:${edge.from.port}`);
    keys.add(`${edge.to.nodeId}:${edge.to.port}`);
  });
  return keys;
}

function connectedText(items = []) {
  return items
    .map(({ source }) => {
      if (source.type === "text") return source.data.text;
      if (source.type === "imageModel" || source.type === "videoModel") return source.data.resultText;
      return source.data.title;
    })
    .filter(Boolean)
    .join("\n");
}

function connectedAssetUrls(items = []) {
  return items.map(({ source }) => source.data.resultUrl).filter(Boolean);
}

function connectedPreviewSource(items = []) {
  const source = items.filter(({ source: item }) => item.data.resultUrl).at(-1)?.source;
  if (!source) return null;

  return {
    url: source.data.resultUrl,
    type: previewMediaType(source),
    label: sourceLabel(source)
  };
}

function previewMediaType(source) {
  if (source.type === "video" || source.type === "videoModel") return "video";
  if (/\.(mp4|mov|webm)$/i.test(source.data.resultUrl || "")) return "video";
  return "image";
}

function connectedImagePromptItems(items = []) {
  return items
    .map(({ source }) => {
      if (!source.data.resultUrl) return null;
      return {
        url: source.data.resultUrl,
        label: source.type === "transfer" ? "TRANSFER.png" : sourceLabel(source)
      };
    })
    .filter(Boolean);
}

function buildEffectiveImagePrompt(prompt, items = [], aspectRatio) {
  const hasTransferReference = items.some(({ source }) => source.type === "transfer" && source.data.resultUrl);
  const promptInstructions = items
    .flatMap(({ source }) => promptPiecesForSource(source))
    .filter(Boolean);

  if (!promptInstructions.length) return prompt;

  const ratio = extractAspectRatio(aspectRatio);
  const aspectInstruction = hasTransferReference && ratio
    ? `Generate the final image in the Image Model node's selected ${ratio} aspect ratio. Do not copy TRANSFER.png's collage layout or aspect ratio into the final image.`
    : "";

  return [prompt, ...promptInstructions, aspectInstruction].filter(Boolean).join("\n\n");
}

function promptPiecesForSource(source) {
  if (source.type === "camera") {
    return cameraPromptPieces(source);
  }

  if (source.type === "style") {
    const selectedPreset = source.data.stylePreset || "None";
    return [stylePresetPrompts[selectedPreset] || ""].filter(Boolean);
  }

  if (source.type !== "transfer" || !source.data.activated || !source.data.resultUrl) return [];

  return [source.data.hiddenPrompt || transferPromptSuffix].filter(Boolean);
}

function cameraPromptPieces(source) {
  const selectedShot = source.data.shotPreset || "None";
  const selectedLens = source.data.lensPreset || "None";
  const selectedType = source.data.typePreset || "None";

  return [
    shotPresetPrompts[selectedShot] || "",
    lensPresetPrompts[selectedLens] || "",
    typePresetPrompts[selectedType] || ""
  ].filter(Boolean);
}

function hasCameraPreset(source) {
  return cameraPromptPieces(source).length > 0;
}

function cameraLabel(source) {
  const labels = [source.data.shotPreset, source.data.lensPreset, source.data.typePreset].filter((value) => value && value !== "None");
  return labels.length ? labels.join(" + ") : "Camera";
}

function connectedSummary(items = [], fallback) {
  if (!items.length) return fallback;
  if (items.length === 1) return sourceLabel(items[0].source);
  return `${items.length} connected`;
}

function sourceLabel(source) {
  if (source.type === "camera") return cameraLabel(source);
  if (source.type === "transfer" && source.data.resultUrl) return "TRANSFER.png";
  if (source.type === "style") return (source.data.stylePreset || "None") === "None" ? "Style" : source.data.stylePreset;
  if (source.data.resultUrl) return source.data.resultUrl.split("/").pop();
  if (source.data.fileName) return source.data.fileName;
  return source.data.title || source.type;
}

function extractAspectRatio(value) {
  return String(value || "").match(/\d+:\d+/)?.[0] || "";
}

async function createTransferCollageBlob(images) {
  const loadedImages = await Promise.all(images.map((image) => loadCanvasImage(image.localUrl)));
  const columns = loadedImages.length === 1 ? 1 : loadedImages.length <= 4 ? 2 : 3;
  const rows = Math.ceil(loadedImages.length / columns);
  const cellSize = 512;
  const gap = 18;
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellSize;
  canvas.height = rows * cellSize;

  const context = canvas.getContext("2d");
  context.fillStyle = "#0d0d0d";
  context.fillRect(0, 0, canvas.width, canvas.height);

  loadedImages.forEach((image, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * cellSize + gap / 2;
    const y = row * cellSize + gap / 2;
    const size = cellSize - gap;
    drawImageCover(context, image, x, y, size, size);
    context.strokeStyle = "rgba(255, 255, 255, 0.16)";
    context.lineWidth = 2;
    context.strokeRect(x, y, size, size);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not create TRANSFER.png."));
      }
    }, "image/png");
  });
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load one of the transfer images."));
    image.src = src;
  });
}

function drawImageCover(context, image, x, y, width, height) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function normalizeRect(start, current) {
  return {
    left: Math.min(start.x, current.x),
    top: Math.min(start.y, current.y),
    right: Math.max(start.x, current.x),
    bottom: Math.max(start.y, current.y)
  };
}

function rectsIntersect(first, second) {
  return first.left <= second.right && first.right >= second.left && first.top <= second.bottom && first.bottom >= second.top;
}

function cloneGraphState(state) {
  return {
    nodes: state.nodes.map(cloneNode),
    edges: state.edges.map(cloneEdge),
    viewport: { ...state.viewport },
    selectedNodeIds: [...state.selectedNodeIds]
  };
}

function cloneNode(node) {
  return {
    ...node,
    data: JSON.parse(JSON.stringify(node.data || {}))
  };
}

function cloneEdge(edge) {
  return {
    ...edge,
    from: { ...edge.from },
    to: { ...edge.to }
  };
}

function loadNodeEditorDraft() {
  const fallbackGraph = normalizeEditorGraph(initialNodes, initialEdges);
  const fallback = {
    nodes: fallbackGraph.nodes,
    edges: fallbackGraph.edges,
    viewport: { x: 0, y: 0, scale: 1 },
    projectId: null,
    projectName: "Untitled node project",
    savedProjectName: null
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(nodeDraftStorageKey) || "null");
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return fallback;
    const graph = normalizeEditorGraph(parsed.nodes, parsed.edges);
    return {
      nodes: graph.nodes,
      edges: graph.edges,
      viewport: parsed.viewport || fallback.viewport,
      projectId: parsed.projectId || null,
      projectName: parsed.projectName || fallback.projectName,
      savedProjectName: parsed.savedProjectName || null
    };
  } catch {
    return fallback;
  }
}

function normalizeEditorGraph(nodes = [], edges = []) {
  const normalizedNodes = [];
  const legacySplits = new Map();

  nodes.forEach((node) => {
    if (isLegacyDirectionNode(node)) {
      const split = splitLegacyDirectionNode(node);
      normalizedNodes.push(split.transferNode);
      if (split.cameraNode) normalizedNodes.push(split.cameraNode);
      if (split.styleNode) normalizedNodes.push(split.styleNode);
      legacySplits.set(node.id, split);
      return;
    }

    normalizedNodes.push(clearStaleRunningState(node));
  });

  const nodeMap = new Map(normalizedNodes.map((node) => [node.id, node]));
  const normalizedEdges = [];

  edges.forEach((edge) => {
    const split = legacySplits.get(edge.from.nodeId);
    if (split) {
      normalizedEdges.push(...edgesForLegacyDirection(edge, split));
      return;
    }

    const normalizedEdge = normalizeEdgeForCurrentGraph(edge, nodeMap);
    if (normalizedEdge) normalizedEdges.push(normalizedEdge);
  });

  return {
    nodes: normalizedNodes,
    edges: dedupeEdges(normalizedEdges)
  };
}

function isLegacyDirectionNode(node) {
  return node.type === "direction" || (node.type === "style" && hasLegacyDirectionData(node));
}

function hasLegacyDirectionData(node) {
  const data = node.data || {};
  return Array.isArray(data.styleImages) || "activated" in data || "locked" in data || "hiddenPrompt" in data || "shotPreset" in data || "lensPreset" in data || "typePreset" in data;
}

function splitLegacyDirectionNode(node) {
  const data = node.data || {};
  const transferNode = clearStaleRunningState({
    ...node,
    type: "transfer",
    data: {
      ...data,
      title: transferTitleFromLegacy(data.title),
      transferImages: data.transferImages || data.styleImages || [],
      hiddenPrompt: transferPromptSuffix
    }
  });

  const cameraNode = hasCameraPreset({ data })
    ? {
        id: `${node.id}-camera`,
        type: "camera",
        x: node.x + 360,
        y: node.y,
        data: {
          title: "Camera",
          shotPreset: data.shotPreset || "None",
          lensPreset: data.lensPreset || "None",
          typePreset: data.typePreset || "None"
        }
      }
    : null;

  const styleNode =
    data.stylePreset && data.stylePreset !== "None"
      ? {
          id: `${node.id}-style`,
          type: "style",
          x: node.x + 360,
          y: node.y + 118,
          data: {
            title: "Style",
            stylePreset: data.stylePreset
          }
        }
      : null;

  return {
    originalId: node.id,
    transferNode,
    cameraNode,
    styleNode
  };
}

function edgesForLegacyDirection(edge, split) {
  const edges = [];

  if (edge.to.port === "imagePromptIn") {
    edges.push({
      ...cloneEdge(edge),
      id: `${edge.id}-transfer`,
      from: { nodeId: split.transferNode.id, port: "transferOut" },
      to: { ...edge.to, port: "transferIn" },
      color: portColors.transfer
    });

    if (split.cameraNode) {
      edges.push({
        id: `${edge.id}-camera`,
        from: { nodeId: split.cameraNode.id, port: "cameraOut" },
        to: { ...edge.to, port: "cameraIn" },
        color: portColors.camera
      });
    }

    if (split.styleNode) {
      edges.push({
        id: `${edge.id}-style`,
        from: { nodeId: split.styleNode.id, port: "styleOut" },
        to: { ...edge.to, port: "styleIn" },
        color: portColors.style
      });
    }
  }

  if (edge.to.port === "sourceIn") {
    edges.push({
      ...cloneEdge(edge),
      id: `${edge.id}-transfer`,
      from: { nodeId: split.transferNode.id, port: "transferOut" },
      color: portColors.transfer
    });
  }

  return edges;
}

function normalizeEdgeForCurrentGraph(edge, nodeMap) {
  const source = nodeMap.get(edge.from.nodeId);
  if (!source) return null;

  const nextEdge = cloneEdge(edge);

  if (source.type === "transfer") {
    nextEdge.from.port = "transferOut";
    if (nextEdge.to.port === "imagePromptIn") nextEdge.to.port = "transferIn";
    nextEdge.color = portColors.transfer;
  }

  if (source.type === "camera") {
    nextEdge.from.port = "cameraOut";
    nextEdge.color = portColors.camera;
  }

  if (source.type === "style") {
    nextEdge.from.port = "styleOut";
    nextEdge.color = portColors.style;
  }

  return nextEdge;
}

function dedupeEdges(edges) {
  const seen = new Set();
  return edges.filter((edge) => {
    const key = `${edge.from.nodeId}:${edge.from.port}->${edge.to.nodeId}:${edge.to.port}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clearStaleRunningState(node) {
  if (node.data?.status !== "running") return node;

  return {
    ...node,
    data: {
      ...node.data,
      status: node.data.resultUrl ? "complete" : "ready"
    }
  };
}

function transferTitleFromLegacy(title) {
  if (!title) return "Transfer";
  return String(title).replace(/^(Style|Direction)\b/, "Transfer");
}

function roundPreviewScale(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
