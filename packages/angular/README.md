# @skyscribe-sdk/angular

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/angular)](https://www.npmjs.com/package/@skyscribe-sdk/angular)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Angular service and injection functions for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Angular 16 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with idiomatic Angular reactivity. Ships two APIs — pick whichever fits your component style.

## Installation

```bash
npm install @skyscribe-sdk/angular
```

## Observable API — `ScribeService`

`ScribeService` is provided in the root injector (`providedIn: 'root'`) and returns cold Observables. The underlying fetch is cancelled automatically when you unsubscribe.

Compose with the `async` pipe for the most concise result:

```ts
import { Component, inject } from "@angular/core";
import { AsyncPipe, NgIf, NgFor } from "@angular/common";
import { ScribeService } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor],
  template: `
    <ng-container *ngIf="publication$ | async as publication">
      <h1>{{ publication.name }}</h1>
      <ul>
        <li *ngFor="let category of publication.categories">{{ category.title }}</li>
      </ul>
    </ng-container>
  `,
})
export class BlogComponent {
  publication$ = inject(ScribeService).getPublication("alice.bsky.social", "https://alice.bsky.social");
}
```

For explicit subscription management:

```ts
export class BlogComponent implements OnInit, OnDestroy {
  publication: StandardPublication | null = null;
  loading = true;
  error: Error | null = null;

  private sub: Subscription | undefined;

  constructor(private scribe: ScribeService) {}

  ngOnInit() {
    this.sub = this.scribe.getPublication("alice.bsky.social", "https://alice.bsky.social").subscribe({
      next:  (publication) => { this.publication = publication; this.loading = false; },
      error: (err)  => { this.error = err; this.loading = false; },
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
```

`getDocumentBySlug` follows the same pattern, emitting the Document (its `uri` is its AT URI):

```ts
document$ = inject(ScribeService).getDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
```

`getDocument(author, rkey)` and `injectDocument(author, rkey)` fetch by record key instead, for when you already have a `DocumentRef`. Don't pass them a slug.

## Signals API — `injectPublication` / `injectDocumentBySlug`

Injection functions that return readonly signals. The fetch is aborted automatically when the host component is destroyed.

```ts
import { Component } from "@angular/core";
import { NgIf } from "@angular/common";
import { injectDocumentBySlug } from "@skyscribe-sdk/angular";

@Component({
  standalone: true,
  imports: [NgIf],
  template: `
    <p *ngIf="vm.loading()">Loading…</p>
    <p *ngIf="vm.error()">{{ vm.error()!.message }}</p>
    <article *ngIf="vm.document() as doc">
      <h1>{{ doc.title }}</h1>
      <div [innerHTML]="doc.content"></div>
    </article>
  `,
})
export class DocumentComponent {
  vm = injectDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
}
```

`injectPublication` returns `{ publication, loading, error }` as readonly signals:

```ts
vm = injectPublication("alice.bsky.social", "https://alice.bsky.social");
// vm.publication(), vm.loading(), vm.error()
```

> **Note:** Injection functions must be called in an injection context — inside a constructor or class field initialiser. They cannot be called inside lifecycle hooks or event handlers.

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/angular";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
