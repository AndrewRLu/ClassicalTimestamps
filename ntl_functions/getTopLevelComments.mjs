export const handler = async (event, context) => {

  //prevent getting blocked
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.youtube.com',
        'Access-Control-Allow-Headers': 'content-type'
        }
    };
  }


  //youtube api req
  const maxResults = 100;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const { videoID, nextPageToken } = JSON.parse(event.body);
  const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=${maxResults}&order=relevance&videoId=${videoID}&key=${youtubeApiKey}&pageToken=${nextPageToken}`);
  const callResponseJSON = await callResponse.json();
  const pageComments = callResponseJSON.items.map(comment => comment.snippet.topLevelComment.snippet.textOriginal);
  let npt = callResponseJSON.nextPageToken || "";

  return {
    statusCode: 200,
    body: JSON.stringify({
      comments: pageComments, token: npt
    }),
  }
}