import type { Preview } from '@storybook/nextjs-vite'
import 'rsuite/dist/rsuite.min.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;