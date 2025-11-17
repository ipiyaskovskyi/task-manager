declare module 'swagger-ui-react' {
  import { Component } from 'react';

  interface SwaggerUIProps {
    spec?: Record<string, unknown> | string;
    url?: string;
    [key: string]: unknown;
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}
