package crawler

import (
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gocolly/colly/v2"
)

type Result struct {
	URL        string `json:"url"`
	Status     int    `json:"status"`
	Title      string `json:"title,omitempty"`
	Error      string `json:"error,omitempty"`
	DurationMs int64  `json:"durationMs"`
}

type Crawler struct {
	baseURL string
}

func New(baseURL string) *Crawler {
	if baseURL == "" {
		baseURL = "https://bidgari.co.ke"
	}
	return &Crawler{baseURL: strings.TrimRight(baseURL, "/")}
}

func (c *Crawler) CheckURLs(urls []string, maxConcurrent int) []Result {
	if maxConcurrent < 1 {
		maxConcurrent = 4
	}
	sem := make(chan struct{}, maxConcurrent)
	var mu sync.Mutex
	out := make([]Result, 0, len(urls))
	var wg sync.WaitGroup

	for _, raw := range urls {
		u := c.resolve(raw)
		if u == "" {
			continue
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(target string) {
			defer wg.Done()
			defer func() { <-sem }()
			r := c.checkOne(target)
			mu.Lock()
			out = append(out, r)
			mu.Unlock()
		}(u)
	}
	wg.Wait()
	return out
}

func (c *Crawler) resolve(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if strings.HasPrefix(raw, "/") {
		return c.baseURL + raw
	}
	return c.baseURL + "/" + raw
}

func (c *Crawler) checkOne(target string) Result {
	start := time.Now()
	r := Result{URL: target}

	col := colly.NewCollector(
		colly.Async(false),
		colly.MaxDepth(0),
	)
	col.SetRequestTimeout(20 * time.Second)

	col.OnResponse(func(e *colly.Response) {
		r.Status = e.StatusCode
	})
	col.OnHTML("title", func(e *colly.HTMLElement) {
		r.Title = strings.TrimSpace(e.Text)
	})
	col.OnError(func(rsp *colly.Response, err error) {
		if rsp != nil && rsp.StatusCode > 0 {
			r.Status = rsp.StatusCode
		}
		if err != nil {
			r.Error = err.Error()
		}
	})

	_ = col.Visit(target)
	r.DurationMs = time.Since(start).Milliseconds()
	return r
}

// CrawlSite fetches seed paths relative to base (shallow smoke).
func (c *Crawler) CrawlSite(paths []string) []Result {
	if len(paths) == 0 {
		paths = []string{"/", "/cars", "/duty", "/sitemap.xml", "/robots.txt"}
	}
	urls := make([]string, 0, len(paths))
	for _, p := range paths {
		if u := c.resolve(p); u != "" {
			urls = append(urls, u)
		}
	}
	return c.CheckURLs(urls, 3)
}

func (c *Crawler) SameHost(u string) bool {
	parsed, err := url.Parse(u)
	if err != nil {
		return false
	}
	base, err := url.Parse(c.baseURL)
	if err != nil {
		return false
	}
	return strings.EqualFold(parsed.Host, base.Host)
}
