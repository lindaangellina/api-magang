export class BaseRepository<T extends { id: number }> {
  protected data: T[];

  constructor(initialData: T[]) {
    this.data = initialData;
  }

  findAll(): T[] {
    return this.data;
  }

  findById(id: number): T | undefined {
    return this.data.find((item) => item.id === id);
  }

  create(item: T): T {
    this.data.push(item);
    return item;
  }

  update(id: number, perubahan: Partial<T>): T | undefined {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    this.data[index] = { ...this.data[index], ...perubahan };
    return this.data[index];
  }

  delete(id: number): boolean {
    const index = this.data.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    return true;
  }

  count(): number {
    return this.data.length;
  }

  nextId(): number {
    return this.data.length > 0 ? Math.max(...this.data.map((item) => item.id)) + 1 : 1;
  }
}