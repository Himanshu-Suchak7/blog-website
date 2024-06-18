import React from "react";
import { useNavigate } from "react-router-dom";

const CommentBox = ({ userId, userComment, setUserComment, handleComment }) => {
  const navigate = useNavigate();
  return (
    <>
      <form className="row blog-form" onSubmit={handleComment}>
        <div className="col-12 py-3">
          <textarea
            rows="4"
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            className="form-control description"
            placeholder="Enter your valuable comment here...."
          />
        </div>
        <div className="col-12 py-3">
          {!userId ? (
            <>
              <h5>Please login or Create an account to post comment</h5>
              <button
                className="btn btn-success"
                onClick={() => navigate("/auth")}
              >
                Login
              </button>
            </>
          ) : (
            <button className="btn btn-primary" type="submit">
              Post Comment
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default CommentBox;
