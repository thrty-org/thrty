import Link from 'next/link';

export function Hero() {
  return (
    <section className="thrty-hero">
      <img
        src="/thrty/logo.svg"
        alt=""
        width={96}
        height={96}
        className="thrty-hero__logo"
      />
      <h1 className="thrty-hero__title">
        Type-safe AWS Lambda,<br />without the boilerplate.
      </h1>
      <p className="thrty-hero__tagline">
        Compose Lambda handlers from focused middlewares. Add, remove, or
        reorder them — your handler's types stay correct without a single
        annotation.
      </p>
      <div className="thrty-hero__actions">
        <Link href="/quickstart" className="thrty-hero__cta thrty-hero__cta--primary">
          Quickstart
        </Link>
        <Link href="/use-cases/http-api-gateway" className="thrty-hero__cta">
          Use cases
        </Link>
      </div>
      <div className="thrty-hero__meta">
        <span>Zero-dependency core</span>
        <span aria-hidden>·</span>
        <span>Tree-shakeable middlewares</span>
        <span aria-hidden>·</span>
        <span>Standard Schema validation</span>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const features = [
    {
      title: 'Reorder middlewares without touching types',
      body: 'Your handler signature stays correct when you add, remove, or swap a middleware. No annotations to maintain by hand.',
    },
    {
      title: 'Test the business logic, not the middleware stack',
      body: 'compose(...)(handler).actual gives unit tests a direct seam to the actual handler — tests stay fast and don’t break when middleware behavior evolves.',
    },
    {
      title: 'One handler. Inferred types, generated infrastructure, generated client',
      body: 'Write the chain once; @thrty/api-cdk derives your API Gateway and @thrty/cli derives a typed SDK from the same code.',
    },
    {
      title: 'Works with every Lambda trigger',
      body: 'The primitives (inject, validate, errorHandler) are trigger-agnostic — drop them into an HTTP, SQS, EventBridge, S3, or scheduled handler.',
    },
  ];

  return (
    <div className="thrty-features">
      {features.map((f) => (
        <div key={f.title} className="thrty-feature">
          <h3 className="thrty-feature__title">{f.title}</h3>
          <p className="thrty-feature__body">{f.body}</p>
        </div>
      ))}
    </div>
  );
}
