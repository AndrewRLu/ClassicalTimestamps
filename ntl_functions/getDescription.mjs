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
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const { videoID } = JSON.parse(event.body);
  const callResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${youtubeApiKey}`);
  const callResponseJSON = await callResponse.json();
  const description = callResponseJSON.items[0].snippet.description;

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://www.youtube.com', 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: description
    }),
  }
}