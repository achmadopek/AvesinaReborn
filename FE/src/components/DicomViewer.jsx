import { useEffect, useRef } from "react";

import dicomParser from "dicom-parser";

import {
  init as csInit,
  RenderingEngine,
  Enums as csEnums,
  getRenderingEngine,
} from "@cornerstonejs/core";

import {
  init as toolsInit,
  ToolGroupManager,
  ZoomTool,
  PanTool,
  WindowLevelTool,
  Enums as toolEnums,
  addTool,
} from "@cornerstonejs/tools";

import {
  init as dicomInit,
  wadouri,
} from "@cornerstonejs/dicom-image-loader";

// ======================
// INIT ONCE
// ======================
csInit();
toolsInit();
dicomInit();

const renderingEngineId = "engine1";
const viewportId = "viewport1";
const toolGroupId = "toolGroup1";

const DicomViewer = ({ imageId }) => {
  const elementRef = useRef(null);
  const toolGroupRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !imageId) return;

    let renderingEngine = getRenderingEngine(renderingEngineId);

    if (!renderingEngine) {
      renderingEngine = new RenderingEngine(renderingEngineId);
    }

    // ======================
    // ENABLE ELEMENT (IMPORTANT)
    // ======================
    renderingEngine.enableElement({
      viewportId,
      element,
      type: csEnums.ViewportType.STACK,
    });

    // ⚠️ ALWAYS GET FRESH VIEWPORT
    const viewport = renderingEngine.getViewport(viewportId);

    // ======================
    // TOOL INIT
    // ======================
    addTool(ZoomTool);
    addTool(PanTool);
    addTool(WindowLevelTool);

    if (!toolGroupRef.current) {
      const toolGroup =
        ToolGroupManager.createToolGroup(toolGroupId);

      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);

      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [
          { mouseButton: toolEnums.MouseBindings.Primary },
        ],
      });

      toolGroup.setToolActive(PanTool.toolName, {
        bindings: [
          { mouseButton: toolEnums.MouseBindings.Auxiliary },
        ],
      });

      toolGroup.setToolActive(ZoomTool.toolName, {
        bindings: [
          { mouseButton: toolEnums.MouseBindings.Secondary },
        ],
      });

      toolGroup.addViewport(viewportId, renderingEngineId);

      toolGroupRef.current = toolGroup;
    }

    // ======================
    // LOAD IMAGE (FIXED SAFE)
    // ======================
    const load = async () => {
      try {
        console.log("LOADING:", imageId);
    
        // 1. LOAD IMAGE PROPERLY
        const image = await wadouri.loadImage(imageId);
    
        console.log("IMAGE RESULT:", image);
    
        // 2. GET VIEWPORT FRESH
        const viewport = renderingEngine.getViewport(viewportId);
    
        // 3. SET STACK DARI IMAGE OBJECT (INI FIX UTAMA)
        viewport.setStack([image.imageId], 0);
    
        viewport.resetCamera();
        viewport.render();

        console.log("IMAGE OBJECT:", image);
      console.log("IMAGE ID REAL:", image.imageId);
    
      } catch (e) {
        console.error("LOAD ERROR:", e);
      }
    };

    load();

    // ======================
    // CLEANUP PROPERLY
    // ======================
    return () => {
      try {
        renderingEngine.disableElement(viewportId);
      } catch {}
    };
  }, [imageId]);

  const setTool = (tool) => {
    toolGroupRef.current?.setToolActive(tool, {
      bindings: [
        { mouseButton: toolEnums.MouseBindings.Primary },
      ],
    });
  };

  return (
    <div>
      <div
        ref={elementRef}
        style={{
          width: "100%",
          height: "400px",
          background: "black",
        }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setTool(WindowLevelTool.toolName)}>
          Window
        </button>
        <button onClick={() => setTool(PanTool.toolName)}>
          Pan
        </button>
        <button onClick={() => setTool(ZoomTool.toolName)}>
          Zoom
        </button>
      </div>
    </div>
  );
};

export default DicomViewer;