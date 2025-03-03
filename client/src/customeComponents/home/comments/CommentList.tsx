import React from "react";
import CommentItem from "./CommentItem";

const CommentList = ({ comments }: { comments: any[] }) => {

  // Step 1: Organize comments into a nested structure
  const commentMap = new Map();

  // Step 2: Convert flat array into a nested structure
  comments.forEach((comment) => {
    commentMap.set(comment._id, { ...comment, replies: [] });
  });

  const nestedComments: any[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      // Add to parent comment's replies array
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(commentMap.get(comment._id));
      }
    } else {
      // Top-level comment
      nestedComments.push(commentMap.get(comment._id));
    }
  });

  

  return (
    <div >
      {nestedComments.map((comment) => (
        <CommentItem key={comment._id} comment={comment} replies={comment.replies} />
      ))}
    </div>
  );
};

export default CommentList;
