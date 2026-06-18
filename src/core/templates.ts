/**
 * @module ContentTemplates
 * @description Standard Editor.js JSON templates for legal and system pages.
 * These templates provide robust starting points for essential pages like
 * Terms of Service and Privacy Policy.
 */

import { PortableTextBlockSchema } from "@core/schema";
import { z } from "zod";

type PortableTextBlock = z.infer<typeof PortableTextBlockSchema>;

/**
 * Generates a random 10-character alphanumeric ID for Editor.js blocks.
 *
 * @returns A random 10-character alphanumeric string.
 */
export const generateId = (): string =>
  Math.random().toString(36).substring(2, 12);

/**
 * Generates a robust Terms of Service template.
 *
 * @param site - The display name of the website.
 * @param author - The legal entity name or author.
 * @param date - The current date string.
 * @returns A PortableTextBlock array populated with standard Terms blocks.
 */
export const getTermsTemplate = (
  site: string,
  author: string,
  date: string,
): PortableTextBlock[] => [
  {
    _type: "block",
    style: "h1",
    children: [{ _type: "span", text: "Terms of Service" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text: `Last Updated: ${date}` }],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "1. Acceptance of Terms" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `By accessing and using the website ${site} ("the Site"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.`,
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "2. Use License" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `Permission is granted to temporarily download one copy of the materials (information or software) on ${author}'s website for personal, non-commercial transitory viewing only.`,
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "3. Disclaimer" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `The materials on the Site are provided on an 'as is' basis. ${author} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`,
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "4. Limitations" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `In no event shall ${author} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Site, even if ${author} or an authorized representative has been notified orally or in writing of the possibility of such damage.`,
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "5. Governing Law" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.`,
      },
    ],
  },
];

/**
 * Generates a robust Privacy Policy template.
 *
 * @param site - The display name of the website.
 * @param author - The legal entity name or author.
 * @param date - The current date string.
 * @returns A PortableTextBlock array populated with standard Privacy Policy blocks.
 */
export const getPrivacyTemplate = (
  site: string,
  author: string,
  date: string,
): PortableTextBlock[] => [
  {
    _type: "block",
    style: "h1",
    children: [{ _type: "span", text: "Privacy Policy" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [{ _type: "span", text: `Last Updated: ${date}` }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `Your privacy is important to us. It is ${author}'s policy to respect your privacy regarding any information we may collect from you across our website, ${site}, and other sites we own and operate.`,
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "1. Information We Collect" }],
  },
  {
    _type: "block",
    style: "h3",
    children: [{ _type: "span", text: "Log Data" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "When you visit our website, our servers may automatically log the standard data provided by your web browser. It may include your computer’s Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, and other details.",
      },
    ],
  },
  {
    _type: "block",
    style: "h3",
    children: [{ _type: "span", text: "Personal Information" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "We may ask for personal information, such as your name and email address. This data is only collected when you voluntarily submit it to us.",
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "2. Legal Bases for Processing" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "We will process your personal information lawfully, fairly, and in a transparent manner. We collect and process information about you only where we have legal bases for doing so.",
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [
      { _type: "span", text: "3. Security of Your Personal Information" },
    ],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "When we collect and process personal information, and while we retain this information, we will protect it within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.",
      },
    ],
  },
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "4. Contact Us" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: `If you have any questions about this privacy policy or our treatment of your personal information, please contact us via our site ${site}.`,
      },
    ],
  },
];
