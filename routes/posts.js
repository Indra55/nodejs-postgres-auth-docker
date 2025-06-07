const express = require("express");
const router = express.Router();
const  pool  = require("../config/dbConfig");
const { checkAuthenticated, checkNotAuthenticated } = require("../middleware/auth");

router.get("/posts", checkNotAuthenticated, async (req, res) => {
  try {
    const query = `
      SELECT 
        posts.id,
        posts.content,
        posts.upvotes,
        posts.downvotes,
        posts.user_id,
        posts.created,
        users.username,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created DESC;
    `;

    const { rows } = await pool.query(query);

    res.render("posts", { posts: rows });
  } catch (err) {
    console.log(err);
    res.status(500).send("Cannot fetch posts");
  }
});


router.post("/posts/:id/upvote", checkNotAuthenticated, async (req, res) => {
  const postID = req.params.id;
  const userID = req.user.id; 
  const redirectUrl = req.query.redirect || "/posts";

  try {
    const existingVoteRes = await pool.query(
      "SELECT vote_type FROM post_votes WHERE user_id=$1 AND post_id=$2",
      [userID, postID]
    );

    if (existingVoteRes.rowCount === 0) {
      await pool.query("INSERT INTO post_votes(user_id, post_id, vote_type) VALUES ($1, $2, 'upvote')", [userID, postID]);

      await pool.query("UPDATE posts SET upvotes = upvotes + 1 WHERE id=$1", [postID]);
    } else {
      const existingVote = existingVoteRes.rows[0].vote_type;

      if (existingVote === "upvote") {
        await pool.query("DELETE FROM post_votes WHERE user_id=$1 AND post_id=$2", [userID, postID]);

        await pool.query("UPDATE posts SET upvotes = upvotes - 1 WHERE id=$1 AND upvotes > 0", [postID]);
      } else {
        await pool.query("UPDATE post_votes SET vote_type='upvote' WHERE user_id=$1 AND post_id=$2", [userID, postID]);

        await pool.query(
          "UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id=$1 AND downvotes > 0",
          [postID]
        );
      }
    }

    res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Cannot Upvote Post");
  }
});

router.post("/posts/:id/downvote", checkNotAuthenticated, async (req, res) => {
  const postID = req.params.id;
  const userID = req.user.id; 
  const redirectUrl = req.query.redirect || "/posts";

  try {
    const existingVoteRes = await pool.query(
      "SELECT vote_type FROM post_votes WHERE user_id=$1 AND post_id=$2",
      [userID, postID]
    );

    if (existingVoteRes.rowCount === 0) {
      await pool.query("INSERT INTO post_votes(user_id, post_id, vote_type) VALUES ($1, $2, 'downvote')", [userID, postID]);

      await pool.query("UPDATE posts SET downvotes = downvotes + 1 WHERE id=$1", [postID]);
    } else {
      const existingVote = existingVoteRes.rows[0].vote_type;

      if (existingVote === "downvote") {
        
        await pool.query("DELETE FROM post_votes WHERE user_id=$1 AND post_id=$2", [userID, postID]);

        await pool.query("UPDATE posts SET downvotes = downvotes - 1 WHERE id=$1 AND downvotes > 0", [postID]);
      } else {

        await pool.query("UPDATE post_votes SET vote_type='downvote' WHERE user_id=$1 AND post_id=$2", [userID, postID]);

        await pool.query(
          "UPDATE posts SET downvotes = downvotes + 1, upvotes = upvotes - 1 WHERE id=$1 AND upvotes > 0",
          [postID]
        );
      }
    }

    res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send("Cannot Downvote Post");
  }
});



router.get("/posts/:id", checkNotAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;  

  try {
    const postQuery = `
      SELECT posts.*, users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.id = $1
    `;
    const commentQuery = `
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE post_id = $1
      ORDER BY comments.created_at ASC
    `;
    const postResult = await pool.query(postQuery, [postId]);
    const commentsResult = await pool.query(commentQuery, [postId]);

    const voteQuery = `
      SELECT vote_type
      FROM post_votes
      WHERE post_id = $1 AND user_id = $2
    `;
    const voteResult = await pool.query(voteQuery, [postId, userId]);

    const userVote = voteResult.rows.length > 0 ? voteResult.rows[0].vote_type : null;

    res.render("singlePost", {
      post: postResult.rows[0],
      comments: commentsResult.rows,
      userVote,  
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("posts/:id/comments",(req,res)=>{
    const postID=req.params.id
    const query = `
      SELECT comments.*, users.username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE post_id = $1
      ORDER BY comments.created_at ASC
    `;
    pool.query(query, [postID],(err,result) =>{
        if(err){
            console.error(err);
            return res.status(500).send("Cannot fetch comments");
        }
        res.render("comments", { comments: result.rows, postId: postID });
    })
})

router.post("/posts/:id/comment", checkNotAuthenticated, (req,res)=>{
    const postID = req.params.id
    const userID = req.user.id
    const content = req.body.content
    const query = `
        INSERT INTO COMMENTS (post_id,user_id,content)
        VALUES ($1, $2, $3) RETURNING id, created_at
    `;
    pool.query(query,[postID,userID,content],(err,result)=>{
        if(err){
            console.error(err)
            return res.status(500).send("Cannot add comment");
        }
        res.redirect(`/posts/${postID}`); 
    })
})


router.post("/posts/create",checkNotAuthenticated,(req,res)=>{
    const {content}=req.body;
    const userID = req.user.id
    const query = `
        INSERT INTO posts(content,user_id)
        VALUES ($1 , $2) RETURNING id, created`

    pool.query(query,[content,userID],(err,result)=>{
        if(err){
            console.error(err)
            return res.status(500).send("Cannot create post");
        }
        req.flash("success_msg", "Post created successfully");
        res.redirect("/posts");
    })
})

module.exports = router;
