import React from "react";

export function ImageViewer({ path }: { path: string }) {
  const [imgData, setImgData] = React.useState<string>("");

  const isSvg = path.toLowerCase().endsWith(".svg");

  React.useEffect(() => {
    const loadImage = async () => {
      if (isSvg) {
        const svgText = await window.electron.get_file_content(path);
        setImgData(svgText);
      } else {
        const dataUrl = await window.electron.readImageBase64(path);
        setImgData(dataUrl);
      }
    };
    loadImage();
  }, [path]);

  return (
    <div className="image-viewer-wrapper">
      {imgData ? (
        isSvg ? (
          <div dangerouslySetInnerHTML={{ __html: imgData }} />
        ) : (
          <img src={imgData} alt={path} />
        )
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
}
