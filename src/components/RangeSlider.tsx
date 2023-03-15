import * as React from "react";
import { Range, getTrackBackground } from "react-range";

const STEP = 0.1;

interface LabeledTwoThumbsProps {
  bounds: [number, number];
  setBounds: (bounds: [number, number]) => void;
}

const LabeledTwoThumbs: React.FC<LabeledTwoThumbsProps> = ({
  bounds,
  setBounds,
}) => {
  const MIN = bounds[0];
  const MAX = bounds[1];
  const [values, setValues] = React.useState<[number, number]>([MIN, MAX]);
  return (
    <div className="range-slider">
      <Range
        values={values}
        step={STEP}
        min={MIN}
        max={MAX}
        onChange={(values) => {
          setValues(values as [number, number]);
          setBounds(values as [number, number]);
        }}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%",
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "5px",
                width: "100%",
                borderRadius: "4px",
                background: getTrackBackground({
                  values,
                  colors: ["#ccc", "#14bb88", "#ccc"],
                  min: MIN,
                  max: MAX,
                }),
                alignSelf: "center",
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ index, props, isDragged }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: "12px",
              width: "12px",
              borderRadius: "4px",
              backgroundColor: "#FFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0px 2px 6px #AAA",
            }}
          >
            {isDragged && (
              <div
                style={{
                  position: "absolute",
                  top: "-28px",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "14px",
                  fontFamily: "Arial,Helvetica Neue,Helvetica,sans-serif",
                  padding: "4px",
                  borderRadius: "4px",
                  backgroundColor: "#14bb88",
                }}
              >
                {values[index].toFixed(1)}
              </div>
            )}
            <div
              style={{
                height: "8px",
                width: "5px",
                backgroundColor: isDragged ? "#14bb88" : "#CCC",
              }}
            />
          </div>
        )}
      />
    </div>
  );
};

export default LabeledTwoThumbs;
