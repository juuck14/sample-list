// 날짜 라벨: ISO → YYYY.MM.DD
export function dateLabel(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

// 샘플 정렬: recent(최근) | oldest(오래된순) | title(제목순)
// recent/oldest 기준은 "YouTube 좋아요 누른 시점"(likedRank: 0=가장 최근).
// likedRank가 없는 예전 샘플은 addedAt으로 폴백하고 항상 뒤로 보낸다.
export function sortSamples(samples, sort) {
  const arr = [...samples]
  arr.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title)

    const aNull = typeof a.likedRank !== 'number'
    const bNull = typeof b.likedRank !== 'number'
    if (aNull && bNull) {
      const t = new Date(a.addedAt) - new Date(b.addedAt)
      return sort === 'oldest' ? t : -t
    }
    if (aNull) return 1 // likedRank 없는 항목은 뒤로
    if (bNull) return -1
    // recent: 좋아요 최신(rank 작은 값)이 위 / oldest: 반대
    return sort === 'oldest' ? b.likedRank - a.likedRank : a.likedRank - b.likedRank
  })
  return arr
}
