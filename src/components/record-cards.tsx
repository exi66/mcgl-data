import type { ReactNode } from "react"
import { ExternalLink } from "lucide-react"
import { ForumPostFrame } from "@/components/forum-post-frame"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getApiUrl } from "@/lib/api"
import { FORUM_URL } from "@/lib/forum-frame"
import type { ForumComment, ForumPost } from "@/types"

const profileUrl = (userId: number) =>
  new URL(`profilemain/${userId}`, FORUM_URL).toString()

function MetaBadge({
  label,
  href,
  primary,
  children,
}: {
  label: string
  href?: string
  primary?: boolean
  children: ReactNode
}) {
  const content = (
    <>
      <span
        className={
          primary ? "text-primary-foreground/80" : "text-muted-foreground"
        }
      >
        {label}:
      </span>
      {children}
      {href && <ExternalLink />}
    </>
  )

  if (!href) {
    return <Badge variant={primary ? "default" : "secondary"}>{content}</Badge>
  }

  return (
    <Badge variant={primary ? "default" : "secondary"} asChild>
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    </Badge>
  )
}

function RecordCard({
  meta,
  children,
}: {
  meta: ReactNode
  children: ReactNode
}) {
  return (
    // overflow-visible: iframe поста растягивается поверх соседних карточек под тултип
    <Card className="overflow-visible rounded-md p-2">
      <CardContent className="space-y-1 px-0">
        <div className="flex flex-row flex-wrap items-end gap-2">{meta}</div>
        {children}
      </CardContent>
    </Card>
  )
}

function PlainText({ text }: { text: string }) {
  return <pre className="whitespace-pre-wrap text-muted-foreground">{text}</pre>
}

const formatDate = (value: string) => new Date(value).toLocaleString()

export function CommentCard({ comment }: { comment: ForumComment }) {
  return (
    <RecordCard
      meta={
        <>
          <MetaBadge
            label="id"
            href={getApiUrl("comments", comment.id)}
            primary
          >
            {comment.id}
          </MetaBadge>
          <MetaBadge label="author" href={profileUrl(comment.author)}>
            {comment.author}
          </MetaBadge>
          <MetaBadge label="user" href={profileUrl(comment.user)}>
            {comment.user}
          </MetaBadge>
          <MetaBadge label="created">{formatDate(comment.created)}</MetaBadge>
        </>
      }
    >
      <PlainText text={comment.plaintext} />
    </RecordCard>
  )
}

export function PostCard({ post }: { post: ForumPost }) {
  return (
    <RecordCard
      meta={
        <>
          <MetaBadge label="id" href={getApiUrl("posts", post.id)} primary>
            {post.id}
          </MetaBadge>
          {post.created && (
            <MetaBadge label="created">{formatDate(post.created)}</MetaBadge>
          )}
        </>
      }
    >
      {post.html ? (
        <ForumPostFrame html={post.html} title={`Пост ${post.id}`} />
      ) : (
        <PlainText text={post.plaintext} />
      )}
    </RecordCard>
  )
}
