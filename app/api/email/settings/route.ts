import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { emailSettings, emailAccounts, emailRules } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/email/settings
 * Get email parsing settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get email general settings
    let generalSettings = await db
      .select()
      .from(emailSettings)
      .then(results => results[0] || null);

    // Create default settings if none exist
    if (!generalSettings) {
      const [newSettings] = await db
        .insert(emailSettings)
        .values({})
        .returning();
      
      generalSettings = newSettings;
    }

    // Get email accounts
    const accounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.isActive, true));

    // Get email rules
    const rules = await db
      .select()
      .from(emailRules)
      .where(eq(emailRules.isActive, true));

    // Combine into the expected format
    const completeSettings = {
      enabled: generalSettings.enabled,
      checkInterval: generalSettings.checkInterval,
      emailAccounts: accounts,
      rules,
      skuDetection: {
        enabled: generalSettings.skuDetectionEnabled,
        autoMap: generalSettings.skuAutoMap,
        confidenceThreshold: generalSettings.skuConfidenceThreshold
      },
      customerDetection: {
        enabled: generalSettings.customerDetectionEnabled,
        autoAssign: generalSettings.customerAutoAssign,
        confidenceThreshold: generalSettings.customerConfidenceThreshold
      }
    };

    return NextResponse.json(createSuccessResponse(completeSettings));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/email/settings
 * Update email parsing settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Start a transaction for potentially updating multiple related tables
    return await db.transaction(async (tx) => {
      // Update the general settings
      let generalSettings = await tx
        .select()
        .from(emailSettings)
        .then(results => results[0] || null);
      
      // If no settings exist yet, create them
      if (!generalSettings) {
        [generalSettings] = await tx
          .insert(emailSettings)
          .values({})
          .returning();
      }
      
      // Update general settings if provided
      if (body.enabled !== undefined || body.checkInterval !== undefined || 
          body.skuDetection !== undefined || body.customerDetection !== undefined) {
        
        const updateData: Record<string, any> = {};
        
        if (body.enabled !== undefined) updateData.enabled = body.enabled;
        if (body.checkInterval !== undefined) updateData.checkInterval = body.checkInterval;
        
        // SKU Detection settings
        if (body.skuDetection) {
          if (body.skuDetection.enabled !== undefined) 
            updateData.skuDetectionEnabled = body.skuDetection.enabled;
          if (body.skuDetection.autoMap !== undefined) 
            updateData.skuAutoMap = body.skuDetection.autoMap;
          if (body.skuDetection.confidenceThreshold !== undefined) 
            updateData.skuConfidenceThreshold = body.skuDetection.confidenceThreshold;
        }
        
        // Customer Detection settings
        if (body.customerDetection) {
          if (body.customerDetection.enabled !== undefined) 
            updateData.customerDetectionEnabled = body.customerDetection.enabled;
          if (body.customerDetection.autoAssign !== undefined) 
            updateData.customerAutoAssign = body.customerDetection.autoAssign;
          if (body.customerDetection.confidenceThreshold !== undefined) 
            updateData.customerConfidenceThreshold = body.customerDetection.confidenceThreshold;
        }
        
        // Update the settings
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          
          [generalSettings] = await tx
            .update(emailSettings)
            .set(updateData)
            .where(eq(emailSettings.id, generalSettings.id))
            .returning();
        }
      }
      
      // Handle email accounts updates
      if (body.emailAccounts && Array.isArray(body.emailAccounts)) {
        for (const account of body.emailAccounts) {
          // For new accounts
          if (account.isNew) {
            delete account.isNew;
            
            await tx
              .insert(emailAccounts)
              .values({
                email: account.email,
                protocol: account.protocol,
                server: account.server,
                port: account.port,
                ssl: account.ssl,
                username: account.username,
                password: account.password,
                folders: account.folders || ['INBOX'],
                isActive: account.isActive !== undefined ? account.isActive : true
              });
          }
          // For updating existing accounts
          else if (account.id) {
            const updateData: Record<string, any> = {};
            
            if (account.email !== undefined) updateData.email = account.email;
            if (account.protocol !== undefined) updateData.protocol = account.protocol;
            if (account.server !== undefined) updateData.server = account.server;
            if (account.port !== undefined) updateData.port = account.port;
            if (account.ssl !== undefined) updateData.ssl = account.ssl;
            if (account.username !== undefined) updateData.username = account.username;
            if (account.password !== undefined) updateData.password = account.password;
            if (account.folders !== undefined) updateData.folders = account.folders;
            if (account.isActive !== undefined) updateData.isActive = account.isActive;
            
            if (Object.keys(updateData).length > 0) {
              updateData.updatedAt = new Date();
              
              await tx
                .update(emailAccounts)
                .set(updateData)
                .where(eq(emailAccounts.id, account.id));
            }
          }
          // For deleting accounts
          else if (account.delete && account.id) {
            await tx
              .delete(emailAccounts)
              .where(eq(emailAccounts.id, account.id));
          }
        }
      }
      
      // Handle email rules updates
      if (body.rules && Array.isArray(body.rules)) {
        for (const rule of body.rules) {
          // For new rules
          if (rule.isNew) {
            delete rule.isNew;
            
            await tx
              .insert(emailRules)
              .values({
                name: rule.name,
                condition: rule.condition,
                action: rule.action || 'parse',
                prioritize: rule.prioritize || false,
                isActive: rule.isActive !== undefined ? rule.isActive : true
              });
          }
          // For updating existing rules
          else if (rule.id) {
            const updateData: Record<string, any> = {};
            
            if (rule.name !== undefined) updateData.name = rule.name;
            if (rule.condition !== undefined) updateData.condition = rule.condition;
            if (rule.action !== undefined) updateData.action = rule.action;
            if (rule.prioritize !== undefined) updateData.prioritize = rule.prioritize;
            if (rule.isActive !== undefined) updateData.isActive = rule.isActive;
            
            if (Object.keys(updateData).length > 0) {
              updateData.updatedAt = new Date();
              
              await tx
                .update(emailRules)
                .set(updateData)
                .where(eq(emailRules.id, rule.id));
            }
          }
          // For deleting rules
          else if (rule.delete && rule.id) {
            await tx
              .delete(emailRules)
              .where(eq(emailRules.id, rule.id));
          }
        }
      }
      
      // Get the updated settings for the response
      const updatedAccounts = await tx
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.isActive, true));
        
      const updatedRules = await tx
        .select()
        .from(emailRules)
        .where(eq(emailRules.isActive, true));
      
      // Combine into the response format
      const updatedSettings = {
        enabled: generalSettings.enabled,
        checkInterval: generalSettings.checkInterval,
        emailAccounts: updatedAccounts,
        rules: updatedRules,
        skuDetection: {
          enabled: generalSettings.skuDetectionEnabled,
          autoMap: generalSettings.skuAutoMap,
          confidenceThreshold: generalSettings.skuConfidenceThreshold
        },
        customerDetection: {
          enabled: generalSettings.customerDetectionEnabled,
          autoAssign: generalSettings.customerAutoAssign,
          confidenceThreshold: generalSettings.customerConfidenceThreshold
        }
      };
      
      return NextResponse.json(createSuccessResponse(updatedSettings));
    });
  } catch (error) {
    return handleApiError(error);
  }
}