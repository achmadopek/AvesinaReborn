// components/LoadingOverlay.js
import imgaeLoading from "../assets/rswjlogo.png";

const LoadingOverlay = ({ show, message = "Loading..." }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div className="text-center">
        <div
          className="spinner-border text-primary"
          style={{ width: "5rem", height: "5rem" }}
          role="status"
        >
          <span className="visually-hidden">
            <img
              src={imgaeLoading}
              alt="Loading..."
              width="100%"
              className="m-1"
            />
          </span>
        </div>
        <p className="mt-2 fw-bold">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
