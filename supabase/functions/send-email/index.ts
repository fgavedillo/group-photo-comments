
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { logger } from "./logger.ts";
import { sendEmail } from "./emailService.ts";
import { corsHeaders } from "./cors.ts";
import { SendEmailRequest } from "./types.ts";

// Create the request handler
const handler = async (req: Request): Promise<Response> => {
  // Generate a unique ID for this request
  const uniqueRequestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  logger.log(`[${uniqueRequestId}] Email function invoked`);
  
  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    logger.log(`[${uniqueRequestId}] Responding to OPTIONS request (CORS preflight)`);
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      } 
    });
  }

  try {
    // Log headers for debugging
    const headersObj = Object.fromEntries(req.headers.entries());
    logger.log(`[${uniqueRequestId}] Headers received:`, JSON.stringify(headersObj));

    // Parse the request body
    const body = await req.json();
    const { to, subject, html, cc, text, attachments, requestId = uniqueRequestId } = body;
    
    logger.log(`[${requestId}] Request data received:`, JSON.stringify({
      to,
      subject,
      hasHtml: !!html,
      htmlLength: html ? html.length : 0,
      hasText: !!text,
      hasCc: !!cc,
      hasAttachments: !!attachments,
      attachmentsCount: attachments ? attachments.length : 0
    }));
    
    // Validate required fields
    if (!to) {
      logger.error(`[${requestId}] 'to' field is required`);
      throw new Error("Campo 'to' es obligatorio");
    }
    
    if (!subject) {
      logger.error(`[${requestId}] 'subject' field is required`);
      throw new Error("Campo 'subject' es obligatorio");
    }
    
    if (!html && !text) {
      logger.error(`[${requestId}] Must provide 'html' or 'text' for email content`);
      throw new Error("Debe proporcionar 'html' o 'text' para el contenido del correo");
    }
    
    logger.log(`[${requestId}] Email request validated: ${to}, Subject: ${subject}`);
    
    // Create the request object
    const emailRequest: SendEmailRequest = {
      to,
      subject,
      requestId
    };
    
    // Add HTML or text content
    if (html) emailRequest.html = html;
    if (text) emailRequest.text = text;
    
    // Add CC if provided
    if (cc) emailRequest.cc = Array.isArray(cc) ? cc : [cc];
    
    // Add attachments if provided
    if (attachments) emailRequest.attachments = attachments;
    
    // Send the email with time measurement
    const startTime = Date.now();
    logger.log(`[${requestId}] Starting email send through service...`);
    
    const result = await sendEmail(emailRequest);
    
    const endTime = Date.now();
    logger.log(`[${requestId}] send-email function call completed in ${endTime - startTime}ms`);
    
    // Return success
    return new Response(JSON.stringify({
      ...result,
      processingTime: `${endTime - startTime}ms`,
      requestId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    logger.error(`[${uniqueRequestId}] Error in send-email function:`, error);
    
    // Return error with details for diagnosis
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Error sending email",
          code: "EMAIL_ERROR",
          details: error.stack || "No additional details available",
          requestId: uniqueRequestId
        }
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

// Start the server
serve(handler);
