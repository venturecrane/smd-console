/// <reference types="@cloudflare/workers-types" />

const REDIRECTS: Record<string, string> = {
  '/about/': '/',
  '/about': '/',
  '/operating-model/': '/',
  '/operating-model': '/',
  '/ventures/': '/',
  '/ventures': '/',
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)

  if (url.hostname === 'www.smdurgan.com') {
    url.hostname = 'smdurgan.com'
    return Response.redirect(url.toString(), 301)
  }

  const redirect = REDIRECTS[url.pathname]
  if (redirect) {
    url.pathname = redirect
    return Response.redirect(url.toString(), 301)
  }

  return context.next()
}
