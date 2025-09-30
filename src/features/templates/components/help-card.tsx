import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export default function HelpCard() {
	const isMobile = useIsMobile();

	return isMobile ? (
		<Accordion
			type="single"
			className="w-full"
			collapsible
			defaultValue="informasi-pengisian-template"
		>
			<AccordionItem
				value="informasi-pengisian-template"
				className="bg-white rounded-xl p-3 space-y-4"
			>
				<AccordionTrigger className="p-0">
					<h2 className="text-sm font-bold text-[#1D2939]">
						Informasi Pengisian Template
					</h2>
				</AccordionTrigger>

				<AccordionContent>
					<ol className="list-decimal list-inside text-sm text-[#090E17] space-y-2">
						<li>
							<b>Pilih dulu tab produk di atas </b>
							<br />
							Misalnya kamu ingin pesan photocard dan figura, cukup pilih salah
							satu dulu untuk mulai atur templatenya, ya!
						</li>
						<li>
							<b>Pilih template yang kamu suka</b>
							<br />
							Scroll dan temukan desain yang paling cocok dengan vibe kamu ✨
						</li>
						<li>
							<b>Edit template sesukamu</b>
							<br />
							Tambahkan nama, ucapan, bentuk lucu, atau foto kenangan—bebas
							kreasi!
						</li>
						<li>
							<b>Klik "Simpan" dan lihat hasilnya</b>
							<br />
							Nanti akan muncul preview dari template yang sudah kamu edit.
						</li>
						<li>
							<b>Kalau sudah oke, lanjut ke produk lainnya </b>
							<br />
							Ulangi langkahnya untuk produk kedua (kalau kamu beli lebih dari
							satu).
						</li>
						<li>
							<b>Terakhir, kirim ke kami</b>
							<br />
							Kami akan proses dan pastikan hasilnya sesuai dengan yang kamu
							mau! 🎁
						</li>
					</ol>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	) : (
		<div className="col-start-1 col-end-3 xl:col-end-2 bg-white rounded-xl px-6 py-5 space-y-4 h-fit">
			<h2 className="text-sm font-bold text-[#1D2939]">
				Informasi Pengisian Template
			</h2>

			<ol className="list-decimal list-inside text-sm text-[#090E17] space-y-2">
				<li>
					<b>Pilih dulu tab produk di atas </b>
					<br />
					Misalnya kamu ingin pesan photocard dan figura, cukup pilih salah satu
					dulu untuk mulai atur templatenya, ya!
				</li>
				<li>
					<b>Pilih template yang kamu suka</b>
					<br />
					Scroll dan temukan desain yang paling cocok dengan vibe kamu ✨
				</li>
				<li>
					<b>Edit template sesukamu</b>
					<br />
					Tambahkan nama, ucapan, bentuk lucu, atau foto kenangan—bebas kreasi!
				</li>
				<li>
					<b>Klik "Simpan" dan lihat hasilnya</b>
					<br />
					Nanti akan muncul preview dari template yang sudah kamu edit.
				</li>
				<li>
					<b>Kalau sudah oke, lanjut ke produk lainnya </b>
					<br />
					Ulangi langkahnya untuk produk kedua (kalau kamu beli lebih dari
					satu).
				</li>
				<li>
					<b>Terakhir, kirim ke kami</b>
					<br />
					Kami akan proses dan pastikan hasilnya sesuai dengan yang kamu mau! 🎁
				</li>
			</ol>
		</div>
	);
}
