import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomImage = ({
    src,
    maxScale = 5,
    className = "",
    style = {},
    showHint = false,
    isMobile = false
}) => {
    if (!src) return null;

    return (
        <div
            className={className}
            style={{
                background: "#000",
                borderRadius: "10px",
                overflow: "hidden",
                position: "relative",
                ...style
            }}
        >
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={maxScale}
                doubleClick={{ mode: "zoomIn" }}
                pinch={{ step: 5 }}
                wheel={{ disabled: true }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <TransformComponent>
                            <img
                                src={src}
                                alt="preview"
                                style={{
                                    width: "100%",
                                    touchAction: "none",
                                    display: "block"
                                }}
                            />
                        </TransformComponent>

                        {/* CONTROL BUTTON */}
                        <div
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                zIndex: 10
                            }}
                        >
                            <button
                                onClick={() => zoomIn()}
                                style={btnStyle}
                            >
                                +
                            </button>

                            <button
                                onClick={() => zoomOut()}
                                style={btnStyle}
                            >
                                −
                            </button>

                            <button
                                onClick={() => resetTransform()}
                                style={btnStyle}
                            >
                                ⟳
                            </button>
                        </div>
                    </>
                )}
            </TransformWrapper>

            {/* Hint */}
            {showHint && isMobile && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 5,
                        right: 8,
                        fontSize: "10px",
                        color: "#fff",
                        background: "rgba(0,0,0,0.5)",
                        padding: "2px 6px",
                        borderRadius: "4px"
                    }}
                >
                    pinch to zoom
                </div>
            )}
        </div>
    );
};

// style tombol biar clean & konsisten
const btnStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer"
};

export default ZoomImage;