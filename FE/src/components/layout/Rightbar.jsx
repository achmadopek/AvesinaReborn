import SkeletonTable from "../../utils/skeletonTable";

const RightContent = ({ content, onClose }) => {
  return (
    <div className="card-body px-3 py-2">
      {content || (
        <div className="card shadow-sm card-theme">
          <div className="card-header py-2 px-3">
            <h6 className="mb-0">
              <b>Selamat Datang</b>
            </h6>
          </div>
          <div className="card-body px-3 py-2">
            <SkeletonTable
              rows={19}
              cols={2}
              responsive={true}
              animated={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RightContent;
