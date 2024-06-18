import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  orderBy,
  where,
} from "firebase/firestore";
// eslint-disable-next-line
import { initializeApp } from "firebase/app";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { isEmpty } from "lodash";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CommentBox from "../components/CommentBox";
import Like from "../components/Like";
import FeatureBlogs from "../components/FeatureBlogs";
import RelatedBlog from "../components/RelatedBlog";
import Tags from "../components/Tags";
import UserComments from "../components/UserComments";
import { db, app } from "../firebase";
import Spinner from "../components/Spinner";
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import { Buffer } from "buffer";
import { Packer, Document, Paragraph, TextRun, ImageRun } from "docx";

const Detail = ({ setActive, user }) => {
  const userId = user?.uid;
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  let [likes, setLikes] = useState([]);
  const [userComment, setUserComment] = useState("");
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [format, setFormat] = useState("pdf"); // State to hold the selected format

  useEffect(() => {
    const getRecentBlogs = async () => {
      const blogRef = collection(db, "blogs");
      const recentBlogs = query(
        blogRef,
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const docSnapshot = await getDocs(recentBlogs);
      setBlogs(docSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    getRecentBlogs();
  }, []);

  useEffect(() => {
    id && getBlogDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  const getBlogDetail = async () => {
    setLoading(true);
    const blogRef = collection(db, "blogs");
    const docRef = doc(db, "blogs", id);
    const blogDetail = await getDoc(docRef);
    const blogs = await getDocs(blogRef);
    let tags = [];
    blogs.docs.map((doc) => tags.push(...doc.get("tags")));
    let uniqueTags = [...new Set(tags)];
    setTags(uniqueTags);
    setBlog(blogDetail.data());
    const relatedBlogsQuery = query(
      blogRef,
      where("tags", "array-contains-any", blogDetail.data().tags, limit(3))
    );
    setComments(blogDetail.data().comments ? blogDetail.data().comments : []);
    setLikes(blogDetail.data().likes ? blogDetail.data().likes : []);
    const relatedBlogSnapshot = await getDocs(relatedBlogsQuery);
    const relatedBlogs = [];
    relatedBlogSnapshot.forEach((doc) => {
      relatedBlogs.push({ id: doc.id, ...doc.data() });
    });
    setRelatedBlogs(relatedBlogs);
    setActive(null);
    setLoading(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    comments.push({
      createdAt: Timestamp.fromDate(new Date()),
      userId,
      name: user?.displayName,
      body: userComment,
    });
    toast.success("Comment posted successfully");
    await updateDoc(doc(db, "blogs", id), {
      ...blog,
      comments,
      timestamp: serverTimestamp(),
    });
    setComments(comments);
    setUserComment("");
  };

  const handleLike = async () => {
    if (userId) {
      if (blog?.likes) {
        const index = likes.findIndex((id) => id === userId);
        if (index === -1) {
          likes.push(userId);
          setLikes([...new Set(likes)]);
        } else {
          likes = likes.filter((id) => id !== userId);
          setLikes(likes);
        }
      }
      await updateDoc(doc(db, "blogs", id), {
        ...blog,
        likes,
        timestamp: serverTimestamp(),
      });
    }
  };

  const storage = getStorage(app);
  const handleDownload = async () => {
    // For PDF
    if (format === "pdf") {
      try {
        const storageRef = ref(storage, blog.imgUrl);
        const imgURL = await getDownloadURL(storageRef);

        const doc = new jsPDF();

        let yOffset = 10;

        const addText = (text, x, y) => {
          const textHeight = doc.getTextDimensions(text).h;
          doc.text(text, x, y);
          return y + textHeight + 2;
        };

        yOffset = addText("Title: " + blog?.title, 10, yOffset);
        yOffset = addText("Created By: " + blog?.author, 10, yOffset);
        yOffset = addText(
          "Created On: " + blog?.timestamp.toDate().toDateString(),
          10,
          yOffset
        );
        yOffset = addText("Category: " + blog?.category, 10, yOffset);
        const width = doc.internal.pageSize.getWidth();
        const descriptionLines = doc.splitTextToSize(
          "Description: " + blog?.description.replace(/<[^>]+>/g, ""),
          width - 20
        );
        descriptionLines.forEach((line) => {
          yOffset = addText(line, 10, yOffset);
        });

        yOffset += 2;

        yOffset = addText("Tags: " + blog?.tags.join(", "), 10, yOffset);

        const img = new Image();
        img.src = imgURL;
        img.onload = () => {
          yOffset = addText("Image: ", 10, yOffset);
          doc.addImage(img, "JPEG", 10, yOffset, 150, 100);
          doc.save("blog.pdf");
        };
        img.onerror = (error) => {
          console.error("Error loading image:", error);
        };
      } catch (error) {
        console.error("Error handling download:", error);
      }
    }
    // For Excel
    else if (format === "excel") {
      const storageRef = ref(storage, blog.imgUrl);
      const imgURL = await getDownloadURL(storageRef);
      const response = await fetch(imgURL);
      const imgBlob = await response.blob();
      // eslint-disable-next-line
      const imgData = await imgBlob.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Blog");
      worksheet.columns = [
        { header: "Title", key: "title", width: 30 },
        { header: "Created By", key: "author", width: 15 },
        { header: "Created On", key: "created_on", width: 20 },
        { header: "Category", key: "category", width: 15 },
        { header: "Description", key: "description", width: 50 },
        { header: "Tags", key: "tags", width: 30 },
        { header: "Image", width: 30 },
      ];
      worksheet.addRow({
        title: blog?.title,
        author: blog?.author,
        created_on: blog?.timestamp.toDate().toDateString(),
        category: blog?.category,
        description: blog?.description.replace(/<[^>]+>/g, ""),
        tags: blog?.tags.join(", "),
      });
      const imgBuffer = Buffer.from(await imgBlob.arrayBuffer());
      worksheet.getRow(2).height = 150;
      const imageId = workbook.addImage({
        buffer: imgBuffer,
        extension: "jpeg",
      });
      worksheet.addImage(imageId, {
        tl: { col: 6, row: 1 },
        ext: { width: 250, height: 150 },
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "blog.xlsx";
      link.click();
      URL.revokeObjectURL(link.href);
    }
    // For Word
    else if (format === "word") {
      const storageRef = ref(storage, blog.imgUrl);
      const imgURL = await getDownloadURL(storageRef);
      const img = new Image();
      img.src = imgURL;
      const response = await fetch(imgURL);
      const imgBlob = await response.blob();
      const imgData = await imgBlob.arrayBuffer();
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Title: " + blog?.title, bold: true }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Created By: " + blog?.author,
                    break: 1,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      "Created On: " + blog?.timestamp.toDate().toDateString(),
                    break: 1,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Category: " + blog?.category,
                    break: 1,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      "Description: " +
                      blog?.description.replace(/<[^>]+>/g, ""),
                    break: 1,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Tags: " + blog?.tags.join(", "),
                    break: 1,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Image:" }),
                  new ImageRun({
                    data: imgData,
                    transformation: { width: 250, height: 150 },
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "blog.docx";
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="single">
      <div
        className="blog-title-box"
        style={{ backgroundImage: `url('${blog?.imgUrl}')` }}
      >
        <div className="overlay"></div>
        <div className="blog-title">
          <span>{blog?.timestamp.toDate().toDateString()}</span>
          <h2>{blog?.title}</h2>
        </div>
      </div>
      <div className="container-fluid pb-4 pt-4 padding blog-single-content">
        <div className="container padding">
          <div className="row mx-0">
            <div className="col-md-8">
              <span className="meta-info text-start">
                By <p className="author">{blog?.author}</p> -&nbsp;
                {blog?.timestamp.toDate().toDateString()}
                <Like handleLike={handleLike} likes={likes} userId={userId} />
              </span>
              {/* <p className="text-start">{blog?.description}</p> */}
              <p
                className="text-start"
                dangerouslySetInnerHTML={{ __html: blog?.description }}
              />
              <div className="text-start">
                <Tags tags={blog?.tags} />
              </div>
              <br />
              <div className="custombox">
                <div className="scroll">
                  <h4 className="small-title">{comments?.length} Comment</h4>
                  {isEmpty(comments) ? (
                    <UserComments
                      msg={
                        "No Comment yet posted on this blog. Be the first to comment"
                      }
                    />
                  ) : (
                    <>
                      {comments?.map((comment) => (
                        <UserComments {...comment} />
                      ))}
                    </>
                  )}
                </div>
              </div>
              <CommentBox
                userId={userId}
                userComment={userComment}
                setUserComment={setUserComment}
                handleComment={handleComment}
              />
              {userId === blog?.userId && (
                <div className="download-section">
                  <select
                    className="format-dropdown"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="word">Word</option>
                    <option value="excel">Excel</option>
                  </select>
                  <button className="download-button" onClick={handleDownload}>
                    Download
                  </button>
                </div>
              )}
            </div>
            <div className="col-md-3">
              <div className="blog-heading text-start py-2 mb-4">Tags</div>
              <Tags tags={tags} />
              <FeatureBlogs title={"Recent Blogs"} blogs={blogs} />
            </div>
          </div>
          <RelatedBlog id={id} blogs={relatedBlogs} />
        </div>
      </div>
    </div>
  );
};

export default Detail;
