interface ProgressBarProps {
  title?: string;
  value: number;
}

export const ProgressBar = ({ title, value }: ProgressBarProps) => {
  return (
    <div className="progress-charts">
      {title && <h6 className="heading heading-h6">{title}</h6>}
      <div className="progress">
        <div
          className="progress-bar wow fadeInLeft"
          data-wow-duration="0.5s"
          data-wow-delay=".3s"
          role="progressbar"
          style={{ width: value + "%" }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
