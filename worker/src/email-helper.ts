import path from 'path';
import { render } from '@react-email/render';

// Helper function to load compiled email components
async function loadEmailComponent(templateName: string) {
  try {
    const modulePath = path.resolve(__dirname, `../emails/${templateName}.js`);
    const templateModule = await import(modulePath);
    return templateModule.default || templateModule;
  } catch (error) {
    throw new Error(`Failed to load email template: ${templateName}. ${error}`);
  }
}

export async function getEmailComponent(templateName: string, data: any): Promise<string> {
  const TemplateComponent = await loadEmailComponent(templateName);
  
  if (!TemplateComponent) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  return render(TemplateComponent(data));
}