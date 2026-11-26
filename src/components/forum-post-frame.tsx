import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'react-intersection-observer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { buildForumDocument, FRAME_SIZE_MESSAGE, type FrameSizeMessage } from '@/lib/forum-frame';

const INITIAL_HEIGHT = 64;
/** Высота свёрнутого поста */
const COLLAPSED_HEIGHT = 360;
/** Сворачиваем, только если скрывается заметная часть, а не пара строк */
const COLLAPSE_THRESHOLD = COLLAPSED_HEIGHT + 160;
/** Отступ сверху при прокрутке к посту после сворачивания */
const SCROLL_OFFSET = 16;

interface ForumPostFrameProps {
  html: string;
  title: string;
}

function isSizeMessage(data: unknown): data is FrameSizeMessage {
  const message = data as Partial<FrameSizeMessage> | null;
  return (
    message?.type === FRAME_SIZE_MESSAGE && typeof message.height === 'number' && typeof message.overlay === 'number'
  );
}

/**
 * Рисует HTML поста в изолированном iframe со стилями и скриптами форума.
 *
 * sandbox без allow-same-origin: у документа непрозрачный origin, поэтому
 * разметка из дампа и скрипты форума не имеют доступа к приложению.
 *
 * Высота iframe равна видимой части поста (прокрутка внутри отключена), а
 * полную высоту содержимого документ сообщает сам. Пока внутри показан
 * тултип, iframe растягивается до его низа поверх следующих карточек,
 * не сдвигая их.
 */
export function ForumPostFrame({ html, title }: ForumPostFrameProps) {
  const { t } = useTranslation();
  // Монтируем iframe только у видимых постов: каждый тянет jQuery и скрипты форума
  const { ref: viewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '600px 0px',
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      viewRef(node);
    },
    [viewRef],
  );
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState<{ height: number; overlay: number }>();
  const [expanded, setExpanded] = useState(false);

  const srcDoc = useMemo(() => buildForumDocument(html), [html]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isSizeMessage(event.data) || event.data.height <= 0) return;
      const { height, overlay } = event.data;
      setSize((prev) => (prev?.height === height && prev.overlay === overlay ? prev : { height, overlay }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const contentHeight = size?.height ?? INITIAL_HEIGHT;
  const overlay = size?.overlay ?? 0;
  const isCollapsible = contentHeight > COLLAPSE_THRESHOLD;
  const isCollapsed = isCollapsible && !expanded;

  // Сколько места пост занимает в вёрстке и какой высоты iframe
  const layoutHeight = isCollapsed ? COLLAPSED_HEIGHT : contentHeight;
  // В свёрнутом посте тултип обрезается вместе с остальным содержимым,
  // в развёрнутом — рисуется поверх соседних карточек
  const frameHeight = isCollapsed ? layoutHeight : Math.max(layoutHeight, overlay);
  const isOverlaying = frameHeight > layoutHeight;

  const collapse = () => {
    setExpanded(false);
    // Если начало поста ушло за верх экрана, возвращаемся к нему
    const top = containerRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      window.scrollBy({ top: top - SCROLL_OFFSET });
    }
  };

  return (
    <div>
      <div ref={setContainerRef} className="relative" style={{ height: layoutHeight }}>
        {!size && <Skeleton className="absolute inset-0" />}
        {inView && (
          <iframe
            ref={frameRef}
            title={title}
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            className="absolute inset-x-0 top-0 block w-full overflow-hidden border-0"
            style={{
              height: frameHeight,
              zIndex: isOverlaying ? 20 : undefined,
              // Иначе при тёмной теме браузер зальёт прозрачный iframe фоном
              colorScheme: 'normal',
            }}
          />
        )}
        {isCollapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-32 items-end justify-center bg-linear-to-b from-transparent to-black pb-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="pointer-events-auto"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown />
              {t('post.expand')}
            </Button>
          </div>
        )}
      </div>
      {isCollapsible && expanded && (
        <div className="flex justify-center pt-2">
          <Button type="button" size="sm" variant="secondary" onClick={collapse}>
            <ChevronUp />
            {t('post.collapse')}
          </Button>
        </div>
      )}
    </div>
  );
}
