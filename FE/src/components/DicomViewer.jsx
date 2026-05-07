import { useEffect, useRef, useCallback, useState } from "react";

// Core
import {
  init as csInit,
  RenderingEngine,
  Enums as csEnums,
  getRenderingEngine,
  imageLoader,
} from "@cornerstonejs/core";

// Tools
import {
  init as toolsInit,
  ToolGroupManager,
  ZoomTool,
  PanTool,
  WindowLevelTool,
  Enums as toolEnums,
  addTool,
} from "@cornerstonejs/tools";

import { init as dicomInit } from "@cornerstonejs/dicom-image-loader";

// ====================== GLOBAL INIT (Sekali saja) ======================
csInit();
toolsInit();
dicomInit();

// Register Tools (PENTING!)
addTool(WindowLevelTool);
addTool(PanTool);
addTool(ZoomTool);

const DicomViewer = ({ imageId }) => {
  const elementRef = useRef(null);
  const toolGroupRef = useRef(null);
  const [activeTool, setActiveTool] = useState("WindowLevelTool");

  const initializeViewer = useCallback(async () => {
    if (!imageId || !elementRef.current) return;

    try {
      const image = await imageLoader.loadImage(imageId);

      let renderingEngine = getRenderingEngine("engine1");
      if (!renderingEngine) {
        renderingEngine = new RenderingEngine("engine1");
      }

      renderingEngine.enableElement({
        viewportId: "viewport1",
        element: elementRef.current,
        type: csEnums.ViewportType.STACK,
      });

      const viewport = renderingEngine.getViewport("viewport1");

      // ==================== TOOL GROUP ====================
      if (!toolGroupRef.current) {
        const toolGroup = ToolGroupManager.createToolGroup("toolGroup1");

        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);

        // Set default tool
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
        });

        toolGroup.addViewport("viewport1", "engine1");
        toolGroupRef.current = toolGroup;
      }

      // Load Image
      await viewport.setStack([image.imageId], 0);

      // Default Window Level X-Ray
      viewport.setProperties({
        voiRange: csEnums.VOIRange.fromWindowLevel(1600, 600),
      });

      viewport.resetCamera();
      viewport.render();

      console.log("✅ DICOM Viewer Loaded Successfully");
    } catch (err) {
      console.error("DICOM Error:", err);
    }
  }, [imageId]);

  useEffect(() => {
    const timer = setTimeout(initializeViewer, 400); // Tunggu modal terbuka
    return () => {
      clearTimeout(timer);
      const engine = getRenderingEngine("engine1");
      if (engine) engine.disableElement("viewport1");
    };
  }, [initializeViewer]);

  // ==================== AKTIFKAN TOOL ====================
  const activateTool = (toolName) => {
    if (!toolGroupRef.current) return;

    // Matikan semua
    toolGroupRef.current.setToolPassive(WindowLevelTool.toolName);
    toolGroupRef.current.setToolPassive(PanTool.toolName);
    toolGroupRef.current.setToolPassive(ZoomTool.toolName);

    // Aktifkan yang dipilih
    toolGroupRef.current.setToolActive(toolName, {
      bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
    });

    setActiveTool(toolName);
  };

  const resetView = () => {
    const viewport = getRenderingEngine("engine1")?.getViewport("viewport1");
    if (viewport) {
      viewport.resetCamera();
      viewport.resetProperties();
      viewport.render();
    }
  };

  return (
    <div>
      <div
        ref={elementRef}
        style={{
          width: "100%",
          height: "520px",
          background: "#000",
          borderRadius: "8px",
          border: "1px solid #444",
        }}
      />

      <div className="mt-3 d-flex gap-2 flex-wrap">
        <button
          className={`btn ${activeTool === WindowLevelTool.toolName ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => activateTool(WindowLevelTool.toolName)}
        >
          🔧 Kontras (Window/Level)
        </button>

        <button
          className={`btn ${activeTool === PanTool.toolName ? "btn-success" : "btn-outline-success"}`}
          onClick={() => activateTool(PanTool.toolName)}
        >
          ✋ Geser Gambar
        </button>

        <button
          className={`btn ${activeTool === ZoomTool.toolName ? "btn-info" : "btn-outline-info"}`}
          onClick={() => activateTool(ZoomTool.toolName)}
        >
          🔍 Zoom
        </button>

        <button className="btn btn-secondary" onClick={resetView}>
          ↺ Reset View
        </button>
      </div>

      <small className="text-muted d-block mt-2">
        Klik tombol tool terlebih dahulu, lalu drag mouse kiri di gambar
      </small>
    </div>
  );
};

export default DicomViewer;