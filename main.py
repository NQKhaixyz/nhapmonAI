"""
He Thong Dinh Tuyen MRT Dai Bac
Diem khoi chay chinh cua chuong trinh.
"""

import sys
import io

# Dam bao ho tro Unicode tren Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stdin.encoding != 'utf-8':
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8', errors='replace')

from utils.data_loader import load_network
from ui.user_cli import run_user_cli
from ui.admin_cli import run_admin_cli


def main():
    """Điểm khởi chạy chính của ứng dụng."""

    # ── Nạp Mạng Lưới ──────────────────────────────────
    print("Đang nạp dữ liệu mạng lưới MRT Đài Bắc...")
    try:
        network = load_network("data/mrt_map.json")
    except FileNotFoundError as e:
        print(f"LỖI: {e}")
        print("Vui lòng đảm bảo file data/mrt_map.json tồn tại.")
        return
    except Exception as e:
        print(f"LỖI khi nạp dữ liệu: {e}")
        return

    print("Nạp mạng lưới thành công!\n")

    # ── Vòng Lặp Menu Chính ─────────────────────────────
    while True:
        print("=" * 40)
        print("  HỆ THỐNG ĐỊNH TUYẾN MRT ĐÀI BẮC")
        print("=" * 40)
        print("  [1] Người dùng  - Tìm đường đi")
        print("  [2] Quản trị    - Quản lý mạng lưới")
        print("  [3] Thoát")
        print("=" * 40)

        choice = input("Lựa chọn của bạn: ").strip()

        if choice == "1":
            run_user_cli(network)
        elif choice == "2":
            run_admin_cli(network)
        elif choice == "3":
            print("Tạm biệt!")
            break
        else:
            print("Lựa chọn không hợp lệ. Vui lòng nhập 1, 2, hoặc 3.\n")


if __name__ == "__main__":
    main()
