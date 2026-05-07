import React from "react";
import {
  ChevronDown,
  FileAudio,
  FileImage,
  Film,
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
  { type: "style", label: "Style", icon: Palette },
  { type: "video", label: "Video", icon: Video },
  { type: "audio", label: "Audio", icon: FileAudio },
  { type: "imageModel", label: "Image Model", icon: ImagePlus },
  { type: "videoModel", label: "Video Model", icon: Film }
];

const portColors = {
  prompt: "#f0c83b",
  image: "#3d85ff",
  video: "#58ce63",
  audio: "#ff8b35"
};

const maxStyleImages = 6;
const stylePromptSuffix =
  "Only use the uploaded collage reference images labeled STYLE.png as a style reference for the color grading, grain style, and camera qualities. The generated image should NOT take content from the collage reference image labeled STYLE.png directly, only use the collage references as a style transfer guide.";
const stylePresetPrompts = {
  None: "",
  Cinematic:
    "High-end cinematic still frame, shot on ARRI Alexa 35, high quality prime lens, high dynamic range, shallow depth of field, atmospheric cinematography, high production value, feature film look.",
  Storyboard:
    "Hand-drawn digital storyboard, line drawing with minimalistic shading, grayscale shading, cinematic composition, production-planning style, loose but intentional drawing, simple tonal blocking, clear visual storytelling. A black and white line drawing. No color. No pencil or charcoal sketches.",
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

export default function NodeEditor() {
  const canvasRef = React.useRef(null);
  const projectMenuRef = React.useRef(null);
  const undoStackRef = React.useRef([]);
  const clipboardRef = React.useRef(null);
  const [nodes, setNodes] = React.useState(initialNodes);
  const [edges, setEdges] = React.useState(initialEdges);
  const [dragState, setDragState] = React.useState(null);
  const [draftEdge, setDraftEdge] = React.useState(null);
  const [portPositions, setPortPositions] = React.useState({});
  const [viewport, setViewport] = React.useState({ x: 0, y: 0, scale: 1 });
  const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);
  const [projectName, setProjectName] = React.useState("Untitled node project");
  const [projectId, setProjectId] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState("");
  const [runningNodeId, setRunningNodeId] = React.useState(null);
  const [compilingStyleNodeId, setCompilingStyleNodeId] = React.useState(null);

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
    const handleResize = () => updatePortPositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewport]);

  React.useEffect(() => {
    function handleKeyDown(event) {
      if (event.target.closest?.("input, textarea, select")) return;

      const commandKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

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
  }, [selectedNodeIds, nodes, edges, viewport]);

  React.useEffect(() => {
    function handlePointerDown(event) {
      if (!projectMenuRef.current?.contains(event.target)) {
        setProjectMenuOpen(false);
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

  function addNode(type) {
    const count = nodes.filter((node) => node.type === type).length + 1;
    const spec = nodeCatalog.find((item) => item.type === type);
    pushUndoSnapshot();
    setNodes((current) => [
      ...current,
      {
        id: `${type}-${Date.now()}`,
        type,
        x: 180 + count * 28,
        y: 160 + count * 24,
        data: createDefaultNodeData(type, spec?.label || "Node", count)
      }
    ]);
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

  async function uploadStyleImages(node, fileList) {
    if (node.data.locked) return;

    const existingImages = Array.isArray(node.data.styleImages) ? node.data.styleImages : [];
    const files = Array.from(fileList || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, maxStyleImages - existingImages.length);

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
        form.append("nodeType", "style");

        const response = await fetch("/api/node/upload-asset", {
          method: "POST",
          body: form
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed.");

        uploadedImages.push({
          id: `style-image-${Date.now()}-${uploadedImages.length}`,
          fileName: data.asset.fileName,
          storedFileName: data.asset.storedFileName,
          mimeType: data.asset.mimeType,
          localUrl: data.asset.localUrl
        });
      }

      updateNode(node.id, {
        styleImages: [...existingImages, ...uploadedImages].slice(0, maxStyleImages),
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

  function removeStyleImage(nodeId, imageId) {
    pushUndoSnapshot();
    updateNode(nodeId, {
      styleImages: nodes.find((node) => node.id === nodeId)?.data.styleImages?.filter((image) => image.id !== imageId) || [],
      activated: false,
      locked: false,
      resultUrl: "",
      fileName: "",
      error: ""
    });
    setEdges((current) => current.filter((edge) => edge.from.nodeId !== nodeId));
  }

  async function activateStyleNode(node) {
    const styleImages = Array.isArray(node.data.styleImages) ? node.data.styleImages.filter((image) => image.localUrl) : [];
    if (!styleImages.length) {
      updateNode(node.id, { error: "Upload at least one image." });
      return;
    }

    try {
      setCompilingStyleNodeId(node.id);
      updateNode(node.id, { status: "compiling", error: "" });
      const collageBlob = await createStyleCollageBlob(styleImages);
      const styleFile = new File([collageBlob], "STYLE.png", { type: "image/png" });
      const form = new FormData();
      form.append("asset", styleFile);
      form.append("nodeId", node.id);

      const response = await fetch("/api/node/upload-style-collage", {
        method: "POST",
        body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not compile STYLE.png.");

      pushUndoSnapshot();
      updateNode(node.id, {
        activated: true,
        locked: true,
        resultUrl: data.asset.localUrl,
        fileName: data.asset.fileName,
        storedFileName: data.asset.storedFileName,
        mimeType: data.asset.mimeType,
        hiddenPrompt: stylePromptSuffix,
        status: "ready",
        error: ""
      });
    } catch (error) {
      updateNode(node.id, { status: "error", error: error.message });
    } finally {
      setCompilingStyleNodeId(null);
    }
  }

  function unlockStyleNode(nodeId) {
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
    if (event.target.closest("input, textarea, select, button, label")) return;
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
        if (!canCreateEdge(draftEdge.from, to)) {
          setSaveStatus("Style output connects to image prompts after locking");
          setDraftEdge(null);
          stopNodeDrag();
          return;
        }

        pushUndoSnapshot();
        setEdges((current) => [
          ...current.filter((edge) => !(edge.from.nodeId === draftEdge.from.nodeId && edge.from.port === draftEdge.from.port && edge.to.nodeId === to.nodeId && edge.to.port === to.port)),
          {
            id: `edge-${Date.now()}`,
            from: draftEdge.from,
            to,
            color: draftEdge.color
          }
        ]);
      }
    }

    setDraftEdge(null);
    stopNodeDrag();
  }

  function canCreateEdge(from, to) {
    const source = nodes.find((node) => node.id === from.nodeId);
    const target = nodes.find((node) => node.id === to.nodeId);

    if (source?.type === "style") {
      return Boolean(source.data.activated && source.data.resultUrl && target?.type === "imageModel" && to.port === "imagePromptIn");
    }

    return true;
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
      setProjects(await response.json());
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function saveProject() {
    try {
      setSaveStatus("Saving...");
      const response = await fetch("/api/node-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          name: projectName,
          nodes,
          edges,
          viewport
        })
      });
      const project = await response.json();
      if (!response.ok) throw new Error(project.error || "Could not save project.");
      setProjectId(project.id);
      setProjectName(project.name);
      setSaveStatus("Saved");
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
      setProjectId(project.id);
      setProjectName(project.name);
      setNodes(project.graph.nodes || []);
      setEdges(project.graph.edges || []);
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
      }
      setProjectMenuOpen(false);
      setSaveStatus("Project deleted");
    } catch (error) {
      setSaveStatus(error.message);
    }
  }

  async function runNode(node) {
    if (node.type !== "imageModel" && node.type !== "videoModel") return;

    const incoming = incomingByNode[node.id] || {};
    const basePrompt = connectedText(incoming.promptIn) || node.data.prompt;

    try {
      setRunningNodeId(node.id);
      updateNode(node.id, { status: "running", error: "" });

      if (node.type === "imageModel") {
        const imagePromptItems = connectedImagePromptItems(incoming.imagePromptIn);
        const prompt = buildEffectiveImagePrompt(basePrompt, incoming.imagePromptIn, node.data.aspectRatio);
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
    } finally {
      setRunningNodeId(null);
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
              onStyleImagesUpload={uploadStyleImages}
              onStyleImageRemove={removeStyleImage}
              onStyleActivate={activateStyleNode}
              onStyleUnlock={unlockStyleNode}
              running={runningNodeId === node.id}
              styleCompiling={compilingStyleNodeId === node.id}
              selected={selectedNodeSet.has(node.id)}
            />
          ))}
        </div>
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
  onStyleImagesUpload,
  onStyleImageRemove,
  onStyleActivate,
  onStyleUnlock,
  running,
  styleCompiling,
  selected
}) {
  const config = getNodeConfig(node.type);
  const Icon = config.icon;

  return (
    <article
      className={`node-card ${node.type} ${selected ? "selected" : ""}`}
      style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
      data-node-card-id={node.id}
      onPointerDown={(event) => onDragStart(event, node)}
    >
      <div className="node-title">
        <span className="node-title-label">
          <Icon size={15} />
          {node.data.title}
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
        onStyleImagesUpload={onStyleImagesUpload}
        onStyleImageRemove={onStyleImageRemove}
        onStyleActivate={onStyleActivate}
        onStyleUnlock={onStyleUnlock}
        styleCompiling={styleCompiling}
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

function StyleCollage({ images, locked, onRemove }) {
  if (!images.length) {
    return (
      <div className="style-collage empty">
        <Palette size={24} />
        <span>No style images yet</span>
      </div>
    );
  }

  return (
    <div className={`style-collage count-${images.length} ${locked ? "locked" : ""}`}>
      {images.map((image) => (
        <div className="style-collage-cell" key={image.id}>
          <img src={image.localUrl} alt={image.fileName || "Style reference"} />
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
  onStyleImagesUpload,
  onStyleImageRemove,
  onStyleActivate,
  onStyleUnlock,
  styleCompiling
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
      <div className="node-body media-node-body">
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

  if (node.type === "style") {
    const styleImages = Array.isArray(node.data.styleImages) ? node.data.styleImages : [];
    const canAddImages = !node.data.locked && styleImages.length < maxStyleImages;
    return (
      <div className="node-body style-node-body">
        {node.data.activated && node.data.resultUrl ? (
          <OutputPortRow node={node} port={outputPort} label="STYLE.png" onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys} />
        ) : (
          <div className="style-output-placeholder">Lock style to enable output</div>
        )}

        <StyleCollage images={styleImages} locked={node.data.locked} onRemove={(imageId) => onStyleImageRemove(node.id, imageId)} />

        <div className="style-preset-row">
          <span>Preset</span>
          <select value={node.data.stylePreset || "None"} onChange={(event) => onUpdate(node.id, { stylePreset: event.target.value })}>
            {stylePresetNames.map((presetName) => (
              <option key={presetName}>{presetName}</option>
            ))}
          </select>
        </div>

        <div className="style-actions">
          <label className={`style-upload-button ${!canAddImages ? "disabled" : ""}`}>
            <FileImage size={16} />
            <span>{styleImages.length ? "Add images" : "Upload images"}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={!canAddImages} onChange={(event) => onStyleImagesUpload(node, event.target.files)} />
          </label>
          <button
            className={`style-lock-button ${node.data.locked ? "locked" : ""}`}
            onClick={() => (node.data.locked ? onStyleUnlock(node.id) : onStyleActivate(node))}
            disabled={styleCompiling || (!node.data.locked && !styleImages.length)}
            title={node.data.locked ? "Unlock style" : "Compile STYLE.png"}
          >
            {node.data.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </div>

        <div className="style-meta">
          <span>{styleImages.length}/{maxStyleImages}</span>
          <span>{styleCompiling ? "Compiling..." : node.data.locked ? "Locked" : "Editable"}</span>
        </div>
        {node.data.fileName && <small>{node.data.fileName}</small>}
        {node.data.status === "uploading" && <small className="upload-status">Uploading...</small>}
        {node.data.error && <small className="upload-error">{node.data.error}</small>}
      </div>
    );
  }

  if (node.type === "imageModel") {
    const promptValue = connectedText(incoming.promptIn) || node.data.prompt;
    const promptConnected = Boolean(connectedText(incoming.promptIn));
    const effectivePromptValue = buildEffectiveImagePrompt(promptValue, incoming.imagePromptIn, node.data.aspectRatio);
    const promptHasGeneratedAdditions = effectivePromptValue !== promptValue;
    const imagePromptLabel = connectedSummary(incoming.imagePromptIn, "Add file");
    const promptPort = config.input.find((port) => port.id === "promptIn");
    const imagePromptPort = config.input.find((port) => port.id === "imagePromptIn");
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
          </select>
        </NodeRow>
        <NodeRow label="Prompt" inputPort={promptPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
          <textarea className={promptConnected ? "connected-field" : ""} value={promptValue} readOnly={promptConnected} onChange={(event) => onUpdate(node.id, { prompt: event.target.value })} />
        </NodeRow>
        {promptHasGeneratedAdditions && (
          <div className="effective-prompt-preview">
            <span>Effective prompt sent to image model</span>
            <textarea readOnly value={effectivePromptValue} />
          </div>
        )}
        <details open>
          <summary>Settings</summary>
          <NodeRow label="Image Prompt" inputPort={imagePromptPort} node={node} onConnectStart={onConnectStart} onDisconnectInput={onDisconnectInput} connectedPortKeys={connectedPortKeys}>
            <button className={imagePromptLabel !== "Add file" ? "connected-field" : ""}>{imagePromptLabel}</button>
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
    style: {
      icon: Palette,
      input: [],
      output: [{ id: "styleOut", label: "STYLE.png", color: portColors.image }]
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
    imageModel: {
      icon: ImagePlus,
      input: [
        { id: "promptIn", label: "Prompt", color: portColors.prompt },
        { id: "imagePromptIn", label: "Image Prompt", color: portColors.image }
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
  if (type === "style") {
    return {
      title,
      styleImages: [],
      stylePreset: "None",
      activated: false,
      locked: false,
      hiddenPrompt: stylePromptSuffix
    };
  }
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

function mediaAccept(type) {
  if (type === "image") return "image/png,image/jpeg,image/webp";
  if (type === "video") return "video/mp4,video/quicktime,video/webm";
  return "audio/mpeg,audio/wav,audio/mp4";
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

function connectedImagePromptItems(items = []) {
  return items
    .map(({ source }) => {
      if (!source.data.resultUrl) return null;
      return {
        url: source.data.resultUrl,
        label: source.type === "style" ? "STYLE.png" : sourceLabel(source)
      };
    })
    .filter(Boolean);
}

function buildEffectiveImagePrompt(prompt, items = [], aspectRatio) {
  const styleInstructions = items
    .flatMap(({ source }) => stylePromptPiecesForSource(source))
    .filter(Boolean);

  if (!styleInstructions.length) return prompt;

  const ratio = extractAspectRatio(aspectRatio);
  const aspectInstruction = ratio
    ? `Generate the final image in the Image Model node's selected ${ratio} aspect ratio. Do not copy STYLE.png's collage layout or aspect ratio into the final image.`
    : "";

  return [prompt, ...styleInstructions, aspectInstruction].filter(Boolean).join("\n\n");
}

function stylePromptPiecesForSource(source) {
  if (source.type !== "style" || !source.data.activated || !source.data.resultUrl) return [];

  const selectedPreset = source.data.stylePreset || "None";
  return [source.data.hiddenPrompt || stylePromptSuffix, stylePresetPrompts[selectedPreset] || ""].filter(Boolean);
}

function connectedSummary(items = [], fallback) {
  if (!items.length) return fallback;
  if (items.length === 1) return sourceLabel(items[0].source);
  return `${items.length} connected`;
}

function sourceLabel(source) {
  if (source.type === "style" && source.data.resultUrl) return "STYLE.png";
  if (source.data.resultUrl) return source.data.resultUrl.split("/").pop();
  if (source.data.fileName) return source.data.fileName;
  return source.data.title || source.type;
}

function extractAspectRatio(value) {
  return String(value || "").match(/\d+:\d+/)?.[0] || "";
}

async function createStyleCollageBlob(images) {
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
        reject(new Error("Could not create STYLE.png."));
      }
    }, "image/png");
  });
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load one of the style images."));
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
