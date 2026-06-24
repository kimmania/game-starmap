#!/usr/bin/env python3
"""Generate Star Battle (Star Map) puzzle banks."""

import json
import random
import sys
import time
from collections import deque
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DIFFICULTY = {
    "tutorial": {"size": 8,  "enforce_uniqueness": True, "target": 2},
    "easy":     {"size": 8,  "enforce_uniqueness": True, "target": 500},
    "medium":   {"size": 10, "enforce_uniqueness": False, "target": 500},
    "hard":     {"size": 10, "enforce_uniqueness": False, "target": 500},
    "expert":   {"size": 12, "enforce_uniqueness": False, "target": 500},
    "master":   {"size": 14, "enforce_uniqueness": False, "target": 500},
}
TARGET = 500  # default fallback
OUTDIR = Path(__file__).resolve().parent.parent / "public" / "puzzles"
OUTDIR.mkdir(parents=True, exist_ok=True)

random.seed(42)


# ---------------------------------------------------------------------------
# Solution generator (no regions)
# ---------------------------------------------------------------------------

def generate_solution(size, tries=10000):
    """Return a list of (r,c) star coordinates, 2 per row/col, no touching."""
    for _ in range(tries):
        seed = random.randint(0, 1_000_000_000)
        random.seed(seed)
        col_usage = [0] * size
        stars = []
        def can_place(r, c1, c2):
            if col_usage[c1] >= 2 or col_usage[c2] >= 2:
                return False
            if abs(c1 - c2) <= 1:
                return False
            for pr, pc in stars:
                if pr == r - 1 and abs(pc - c1) <= 1:
                    return False
                if pr == r - 1 and abs(pc - c2) <= 1:
                    return False
            return True
        def backtrack(r):
            if r == size:
                return True
            available = [c for c in range(size) if col_usage[c] < 2]
            random.shuffle(available)
            # try pairs
            for i in range(len(available)):
                for j in range(i + 1, len(available)):
                    c1, c2 = available[i], available[j]
                    if not can_place(r, c1, c2):
                        continue
                    col_usage[c1] += 1
                    col_usage[c2] += 1
                    stars.append((r, c1))
                    stars.append((r, c2))
                    if backtrack(r + 1):
                        return True
                    stars.pop()
                    stars.pop()
                    col_usage[c1] -= 1
                    col_usage[c2] -= 1
            return False
        if backtrack(0):
            return stars
    return None


# ---------------------------------------------------------------------------
# Region generation (random multi-source BFS)
# ---------------------------------------------------------------------------

def grow_regions(size, num_regions, stars):
    """Return a region grid (list of lists of ints).
    Uses randomized multi-source BFS from each pair of star seeds.
    Guarantees each region is contiguous and contains exactly 2 stars."""
    # pair closest stars greedily for spatial coherence
    star_list = stars[:]
    random.shuffle(star_list)
    unpaired = list(range(len(star_list)))
    random.shuffle(unpaired)
    pairs = []
    while unpaired:
        i = unpaired.pop()
        r1, c1 = star_list[i]
        best = None
        best_d = None
        for jdx, j in enumerate(unpaired):
            r2, c2 = star_list[j]
            d = abs(r1 - r2) + abs(c1 - c2)
            if best_d is None or d < best_d:
                best_d = d
                best = jdx
        if best is not None:
            j = unpaired.pop(best)
            pairs.append((star_list[i], star_list[j]))
        else:
            return None

    assigned = [[-1] * size for _ in range(size)]
    q = deque()
    for idx, p in enumerate(pairs):
        for (r, c) in p:
            assigned[r][c] = idx
            q.append((r, c, idx))
    random.shuffle(q)

    # BFS: cells are assigned to whichever region reaches them first
    while q:
        r, c, rid = q.popleft()
        neighbors = [(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]
        random.shuffle(neighbors)
        for nr, nc in neighbors:
            if 0 <= nr < size and 0 <= nc < size and assigned[nr][nc] == -1:
                assigned[nr][nc] = rid
                q.append((nr, nc, rid))

    # Compact IDs
    unique_ids = sorted({assigned[r][c] for r in range(size) for c in range(size)})
    remap = {old: new for new, old in enumerate(unique_ids)}
    grid = [[remap[assigned[r][c]] for c in range(size)] for r in range(size)]
    return grid


# ---------------------------------------------------------------------------
# Validator: ensure generated solution matches region counts
# ---------------------------------------------------------------------------

def validate_regions(size, regions, stars):
    for rid in range(size):
        cnt = sum(1 for r in range(size) for c in range(size)
                  if regions[r][c] == rid and (r, c) in stars)
        if cnt != 2:
            return False
    return True


# ---------------------------------------------------------------------------
# Solver (lightweight uniqueness/sanity checker)
# ---------------------------------------------------------------------------

def count_solutions(size, regions, limit=2, timeout=1.5):
    import time
    region_of = {}
    rids = set()
    for r in range(size):
        for c in range(size):
            rid = regions[r][c]
            region_of[(r, c)] = rid
            rids.add(rid)
    rid_list = sorted(rids)
    rid_to_idx = {rid: i for i, rid in enumerate(rid_list)}
    num_regions = len(rid_list)
    solutions = 0
    deadline = time.time() + timeout
    col_counts = [0] * size
    row_counts = [0] * size
    region_counts = [0] * num_regions
    stars_by_row = [[] for _ in range(size)]

    def forbidden_in_row(r):
        f = set()
        if r > 0:
            for pc in stars_by_row[r - 1]:
                for dc in (-1, 0, 1):
                    nc = pc + dc
                    if 0 <= nc < size:
                        f.add(nc)
        return f

    def solve_row(r):
        nonlocal solutions
        if solutions >= limit or time.time() > deadline:
            return
        if r == size:
            for rc in region_counts:
                if rc != 2:
                    return
            solutions += 1
            return
        if row_counts[r] >= 2:
            solve_row(r + 1)
            return
        forb = forbidden_in_row(r)
        cols = [c for c in range(size) if c not in forb and col_counts[c] < 2]
        pairs = []
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                c1, c2 = cols[i], cols[j]
                if abs(c1 - c2) <= 1:
                    continue
                pairs.append((c1, c2))
        random.shuffle(pairs)
        for c1, c2 in pairs:
            rid1 = rid_to_idx[region_of[(r, c1)]]
            rid2 = rid_to_idx[region_of[(r, c2)]]
            if region_counts[rid1] >= 2 or region_counts[rid2] >= 2:
                continue
            if rid1 == rid2 and region_counts[rid1] >= 1:
                continue
            stars_by_row[r] = [c1, c2]
            for cc in (c1, c2):
                col_counts[cc] += 1
            row_counts[r] += 2
            region_counts[rid1] += 1
            region_counts[rid2] += 1
            solve_row(r + 1)
            region_counts[rid2] -= 1
            region_counts[rid1] -= 1
            row_counts[r] -= 2
            for cc in (c1, c2):
                col_counts[cc] -= 1
            stars_by_row[r] = []

    solve_row(0)
    return solutions


# ---------------------------------------------------------------------------
# Run one puzzle attempt
# ---------------------------------------------------------------------------

def make_puzzle(size, enforce_uniqueness):
    stars = generate_solution(size)
    if stars is None:
        return None, None
    num_regions = size
    regions = grow_regions(size, num_regions, stars)
    if regions is None:
        return None, None
    if not validate_regions(size, regions, stars):
        return None, None
    if enforce_uniqueness:
        sol_count = count_solutions(size, regions, limit=2, timeout=2.0)
        if sol_count != 1:
            return None, None
    solution_str = "".join(
        "1" if (r, c) in stars else "0"
        for r in range(size) for c in range(size)
    )
    return regions, solution_str


# ---------------------------------------------------------------------------
# Bank generation
# ---------------------------------------------------------------------------

def generate_bank(difficulty, info, target):
    size = info["size"]
    enforce = info["enforce_uniqueness"]
    puzzles = []
    seen = set()
    attempts = 0
    max_attempts = target * (40 if enforce else 20)

    print(f"Generating {difficulty} ({size}x{size}) ...")
    while len(puzzles) < target and attempts < max_attempts:
        attempts += 1
        regions, solution = make_puzzle(size, enforce)
        if regions is None:
            continue
        key = json.dumps(regions)
        if key in seen:
            continue
        seen.add(key)
        pid = f"{difficulty}-{str(len(puzzles) + 1).zfill(4)}"
        puzzles.append({
            "id": pid,
            "size": size,
            "regions": regions,
            "solution": solution,
        })
        if len(puzzles) % 100 == 0:
            print(f"  {difficulty}: {len(puzzles)}/{target} (attempts={attempts})")
    print(f"  {difficulty}: done, {len(puzzles)} puzzles (attempts={attempts})")
    return puzzles


if __name__ == "__main__":
    start = time.time()
    for diff, info in DIFFICULTY.items():
        target = info.get("target", TARGET)
        puzzles = generate_bank(diff, info, target)
        filename = OUTDIR / f"{diff}.json"
        with open(filename, "w") as f:
            json.dump(puzzles, f)
        print(f"  Wrote {len(puzzles)} puzzles to {filename}")
    print(f"Total time: {round(time.time() - start, 1)}s")
