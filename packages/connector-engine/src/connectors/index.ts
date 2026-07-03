import { chatGptFrameworkConnector } from './chatgpt.js';
import { youtubeConnector } from './youtube.js';
import { githubConnector } from './github.js';
import { localFolderConnector } from './local-folder.js';
import { stubConnectors } from './stubs.js';

export const fullConnectors = [
  chatGptFrameworkConnector,
  youtubeConnector,
  githubConnector,
  localFolderConnector,
];

export const allConnectors = [...fullConnectors, ...stubConnectors];

export {
  chatGptFrameworkConnector,
  youtubeConnector,
  githubConnector,
  localFolderConnector,
  stubConnectors,
};
