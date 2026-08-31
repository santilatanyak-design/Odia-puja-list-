const projectId = 'evident-quality-d40ks';
const databaseId = 'ai-studio-remixpujasamagri-17b24a13-3233-4aaf-aaee-fb51d8caed6b';
const docId = 'story-698800';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/spiritual_stories/${docId}`;
fetch(url).then(res => res.json()).then(data => console.log(JSON.stringify(data).substring(0,200))).catch(console.error);
