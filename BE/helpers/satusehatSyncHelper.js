exports.determineSyncAction = ({
    debugMode,
    isComplete,
  }) => {
  
    // DEBUG MODE
    if (debugMode) {
      return {
        mode: "debug",
        message: "DEBUG MODE ENABLED",
      };
    }
  
    // DATA BELUM LENGKAP
    if (!isComplete) {
      return {
        mode: "queue",
        message: "Dependency belum lengkap",
      };
    }
  
    // LANGSUNG KIRIM
    return {
      mode: "send",
      message: "READY",
    };
  
  };