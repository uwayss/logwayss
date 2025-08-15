package crypto

// ScryptParams holds scrypt configuration.
type ScryptParams struct {
	N int
	R int
	P int
}

const (
	DefaultDesktopN = 1 << 15
	DefaultAndroidN = 1 << 14
	DefaultR        = 8
	DefaultP        = 1
)

var (
	DesktopScrypt = ScryptParams{N: DefaultDesktopN, R: DefaultR, P: DefaultP}
	AndroidScrypt = ScryptParams{N: DefaultAndroidN, R: DefaultR, P: DefaultP}
)
