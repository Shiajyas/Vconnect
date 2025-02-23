
import React from "react";



interface PostsProps {

  posts: any[];

}



const Posts: React.FC<PostsProps> = ({ posts }) => {

  return (

    <div>

      {/* Render posts here */}

      {posts.map((post, index) => (

        <div key={index}>{post.content}</div>

      ))}

    </div>

  );

};



export default Posts;
