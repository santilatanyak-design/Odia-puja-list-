const path = "/story/story-290518.html";
const storyIdMatch = path.match(/\/story\/([^\/.]+)/);
if (storyIdMatch && storyIdMatch[1]) {
  console.log("Matched:", storyIdMatch[1]);
} else {
  console.log("Not matched");
}
