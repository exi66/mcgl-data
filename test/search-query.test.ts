import { describe, expect, it } from 'vitest';
import { commentsEntity, postsEntity } from '@/lib/entities';
import { isQueryEmpty, parseSearchQuery } from '@/lib/search-query';

const comments = (q: string) => parseSearchQuery(q, commentsEntity.filters);
const posts = (q: string) => parseSearchQuery(q, postsEntity.filters);

describe('parseSearchQuery', () => {
  it('splits text and filters', () => {
    expect(comments('шахта author:1,2 user:5 руда')).toEqual({
      text: 'шахта руда',
      filters: { author: [1, 2], user: [5] },
      errors: [],
    });
  });

  it('merges repeated int filters without duplicates', () => {
    expect(comments('author:1 author:1,3').filters).toEqual({ author: [1, 3] });
  });

  it('keeps the last date', () => {
    expect(comments('after:2016-01-01 after:2017-02-03').filters).toEqual({ after: ['2017-02-03'] });
  });

  it('reports bad values in Russian', () => {
    expect(comments('author:x before:2017-02-30').errors).toEqual([
      'author: «x» — не целое число',
      'before: «2017-02-30» — ожидается дата ГГГГ-ММ-ДД',
    ]);
  });

  it('leaves unknown keys and URLs in the text', () => {
    expect(comments('foo:1 http://vk.com/a:b').text).toBe('foo:1 http://vk.com/a:b');
  });

  it('takes array filters as strings', () => {
    expect(posts('linksInText:http://vk.com/x usersInText:1,12120').filters).toEqual({
      linksInText: ['http://vk.com/x'],
      usersInText: [1, 12120],
    });
  });

  it('does not treat inherited object keys as filters', () => {
    expect(comments('constructor:1').text).toBe('constructor:1');
  });

  it('detects an empty query', () => {
    expect(isQueryEmpty(comments('  '))).toBe(true);
    expect(isQueryEmpty(comments('id:1'))).toBe(false);
  });
});
