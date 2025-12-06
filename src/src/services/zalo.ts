/**
 * Zalo OA Service
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G5 - Chatbot Core Logic
 *
 * Handles communication with Zalo Official Account API
 */

const ZALO_API_BASE = "https://openapi.zalo.me/v3.0/oa";

export interface ZaloMessage {
  text?: string;
  attachment?: {
    type: string;
    payload: unknown;
  };
}

export interface ZaloTextMessage {
  text: string;
}

/**
 * Send text message to Zalo user
 * @param zaloAccessToken - Shop's Zalo OA access token
 * @param recipientId - Zalo user ID to send message to
 * @param message - Message content
 * @returns Response from Zalo API
 */
export async function sendMessage(
  zaloAccessToken: string,
  recipientId: string,
  message: ZaloTextMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${ZALO_API_BASE}/message/cs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": zaloAccessToken,
      },
      body: JSON.stringify({
        recipient: {
          user_id: recipientId,
        },
        message: {
          text: message.text,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error !== 0) {
      console.error("[Zalo Service] Send message failed:", data);
      return {
        success: false,
        error: data.message || "Failed to send message",
      };
    }

    console.log("[Zalo Service] Message sent successfully:", {
      recipientId,
      messageId: data.data?.message_id,
    });

    return { success: true };
  } catch (error) {
    console.error("[Zalo Service] Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Zalo user profile
 * @param zaloAccessToken - Shop's Zalo OA access token
 * @param userId - Zalo user ID
 * @returns User profile data
 */
export async function getUserProfile(
  zaloAccessToken: string,
  userId: string
): Promise<{ name?: string; avatar?: string } | null> {
  try {
    const response = await fetch(
      `${ZALO_API_BASE}/getprofile?data={"user_id":"${userId}"}`,
      {
        headers: {
          "access_token": zaloAccessToken,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.error !== 0) {
      console.error("[Zalo Service] Get profile failed:", data);
      return null;
    }

    return {
      name: data.data?.display_name || "Khách hàng",
      avatar: data.data?.avatar,
    };
  } catch (error) {
    console.error("[Zalo Service] Error getting profile:", error);
    return null;
  }
}
