import { Configuration, OpenAIApi } from "openai-edge";

const config = new Configuration({
  apiKey: `${process.env.OPENAI_API_KEY}`,
});

const openai = new OpenAIApi(config);

export async function generateImagePrompt(name: string) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an creative and helpful AI assistance capable of generating interesting thumbnail descriptions for my notes. Your output will be fed into the DALLE API to generate a thumbnail. The description should be minimalistic and flat styled",
        },
        {
          role: "user",
          content: `Please generate a thumbnail description for my notebook titles ${name}`,
        },
      ],
    });
    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      if (data.error.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please check your API key and billing status.");
      }
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.choices || !data.choices.length || !data.choices[0].message) {
      console.error("Unexpected API response:", JSON.stringify(data));
      throw new Error("Invalid response from OpenAI API");
    }

    const image_description = data.choices[0].message.content;
    if (!image_description) {
      throw new Error("No content in OpenAI response");
    }

    return image_description as string;
  } catch (error) {
    console.error("Error in generateImagePrompt:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate image prompt");
  }
}

export async function generateImage(image_description: string) {
  try {
    const response = await openai.createImage({
      prompt: image_description,
      n: 1,
      size: "256x256",
    });
    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      if (data.error.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please check your API key and billing status.");
      }
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected API response:", JSON.stringify(data));
      throw new Error("Invalid response from OpenAI API");
    }

    return data.data[0].url as string;
  } catch (error) {
    console.error("Error in generateImage:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate image");
  }
}