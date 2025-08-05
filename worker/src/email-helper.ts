import { render } from '@react-email/render';
import path from 'path';
import { createRequire } from 'module';

const dynamicRequire = createRequire(import.meta.url);

export async function getEmailComponent(templateName: string, data: any): Promise<string> {
  // 1. Resolve the template path
  const templatePath = path.resolve(__dirname, `../../emails/${templateName}.tsx`);
  
  try {
    // 2. Dynamically import the template
     const templateModule = dynamicRequire(templatePath);
    
    // 3. Extract the default export
    const TemplateComponent = templateModule.default;
    
    if (typeof TemplateComponent !== 'function') {
      throw new Error(`Template ${templateName} default export is not a React component`);
    }
    
    // 4. Render to HTML
    return render(TemplateComponent(data));
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw new Error(`Failed to render email template: ${templateName}`);
  }
}