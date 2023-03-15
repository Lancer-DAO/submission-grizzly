import ReactLoading from "react-loading";

export const LoadingBar: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="loading-bar">
      <div className="loading-bar-title">{title}</div>
      <ReactLoading type={"bubbles"} color={"#14bb88"} height={"60px"} />
    </div>
  );
};
