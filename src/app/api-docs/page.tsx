'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Failed to load API docs:', err));
  }, []);

  if (!spec) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading API documentation...
      </div>
    );
  }

  return <SwaggerUI spec={spec} />;
}
